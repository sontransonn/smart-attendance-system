import base64, os, cv2, torch, psycopg2
import numpy as np
import mediapipe as mp
import torch.nn as nn
from datetime import datetime, time
from facenet_pytorch import InceptionResnetV1
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from torchvision.models import mobilenet_v2
from torchvision import transforms
from PIL import Image

# --- 1. CẤU HÌNH & KHỞI TẠO MODEL ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# MediaPipe Face Detector
model_path = "models/blaze_face_short_range.tflite"
options = vision.FaceDetectorOptions(
    base_options=python.BaseOptions(model_asset_path=model_path),
    running_mode=vision.RunningMode.IMAGE,
    min_detection_confidence=0.5
)
detector = vision.FaceDetector.create_from_options(options)

# FaceNet (Recognition)
facenet_model = InceptionResnetV1(pretrained='vggface2').eval().to(device)


# SpoofNet (Anti-spoofing dựa trên notebook của bạn)
class SpoofNet(nn.Module):
    def __init__(self):
        super(SpoofNet, self).__init__()
        # Load backbone MobileNetV2
        self.backbone = mobilenet_v2(weights=None).features
        self.custom_layers = nn.Sequential(
            nn.Conv2d(1280, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        x = self.backbone(x)
        x = self.custom_layers(x)
        return x


spoof_model = SpoofNet().to(device)
try:
    # Load trọng số từ file .pt đã train
    checkpoint = torch.load("models/mobilenetv2-best.pt", map_location=device)
    spoof_model.load_state_dict(checkpoint['state_dict'])
    spoof_model.eval()
    print("--- Load Anti-spoofing model thành công ---")
except Exception as e:
    print(f"--- Lỗi load Anti-spoofing model: {e} ---")

# Preprocessing cho SpoofNet (Resize 224x224 & Normalize)
spoof_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- 2. FASTAPI SETUP ---
app = FastAPI()
app.mount("/storage", StaticFiles(directory="storage"), name="storage")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnrollRequest(BaseModel):
    name: str;
    id: str;
    dept: str;
    images: List[str]


class RecognizeRequest(BaseModel):
    image: str


def get_db_connection():
    return psycopg2.connect(
        host="localhost", database="postgres", user="postgres",
        password="123456", port="5432"
    )


# --- 3. ENDPOINTS QUẢN LÝ ---

@app.get("/api/users")
async def get_users():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
                    SELECT id,
                           full_name,
                           department,
                           image_path,
                           (face_embedding IS NOT NULL) as is_verified
                    FROM users
                    ORDER BY created_at DESC
                    """)
        rows = cur.fetchall()
        return [{"id": r[0], "name": r[1], "dept": r[2], "image_path": r[3], "is_verified": r[4]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()


@app.get("/api/attendance/logs")
async def get_attendance_logs():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
                    SELECT u.full_name, u.department, a.check_in_time, a.confidence, a.status, u.id
                    FROM attendance a
                             JOIN users u ON a.user_id = u.id
                    ORDER BY a.check_in_time DESC LIMIT 50
                    """)
        rows = cur.fetchall()
        return [{
            "user": r[0], "dept": r[1],
            "time": r[2].strftime("%H:%M:%S"),
            "conf": r[3], "status": r[4], "id": r[5]
        } for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()


@app.post("/api/enroll")
async def enroll_user(data: EnrollRequest):
    conn = None
    try:
        clean_id = data.id.strip().lower()
        user_folder = f"storage/raw_faces/{clean_id}"
        os.makedirs(user_folder, exist_ok=True)
        embeddings = []

        for i, base64_str in enumerate(data.images):
            if "base64," in base64_str: base64_str = base64_str.split("base64,")[1]
            img_data = base64.b64decode(base64_str)
            img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
            rgb_frame = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = detector.detect(mp_image)

            if detection_result.detections:
                bbox = detection_result.detections[0].bounding_box
                face_crop = rgb_frame[max(0, bbox.origin_y):bbox.origin_y + bbox.height,
                max(0, bbox.origin_x):bbox.origin_x + bbox.width]
                face_resized = cv2.resize(face_crop, (160, 160))
                face_tensor = (torch.tensor(face_resized).permute(2, 0, 1).float().unsqueeze(0) - 127.5) / 128.0
                with torch.no_grad():
                    embeddings.append(facenet_model(face_tensor.to(device)).cpu().numpy().flatten())
            cv2.imwrite(os.path.join(user_folder, f"{clean_id}_{i + 1}.jpg"), img)

        if not embeddings: raise HTTPException(status_code=400, detail="Không tìm thấy mặt!")

        final_vector = np.mean(embeddings, axis=0).tolist()
        conn = get_db_connection();
        cur = conn.cursor()
        cur.execute("""
                    INSERT INTO users (id, full_name, department, image_path, face_embedding)
                    VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO
                    UPDATE
                    SET full_name = EXCLUDED.full_name, department = EXCLUDED.department, face_embedding = EXCLUDED.face_embedding;
                    """, (clean_id, data.name, data.dept, user_folder, final_vector))
        conn.commit()
        return {"status": "success", "message": f"Đã đăng ký xong {data.name}"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()


# --- 4. LOGIC NHẬN DIỆN & ĐIỂM DANH ---

IN_START = time(6, 0)
IN_LATE = time(8, 0)
IN_END = time(10, 0)


@app.post("/api/recognize")
async def recognize_user(data: RecognizeRequest):
    conn = None
    try:
        # A. Decode Ảnh
        if "base64," in data.image: data.image = data.image.split("base64,")[1]
        img_data = base64.b64decode(data.image)
        img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        h_orig, w_orig, _ = img.shape
        rgb_frame = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # B. Phát hiện mặt
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = detector.detect(mp_image)

        if not detection_result.detections:
            return {"name": "Unknown", "conf": 0, "bbox": None, "attendance_status": ""}

        bbox = detection_result.detections[0].bounding_box
        face_crop = rgb_frame[max(0, bbox.origin_y):bbox.origin_y + bbox.height,
        max(0, bbox.origin_x):bbox.origin_x + bbox.width]

        # C. KIỂM TRA CHỐNG GIẢ MẠO (ANTI-SPOOFING)
        pil_face = Image.fromarray(face_crop)
        input_spoof = spoof_transform(pil_face).unsqueeze(0).to(device)
        with torch.no_grad():
            liveness_score = spoof_model(input_spoof).item()  # Đầu ra Sigmoid (0-1)

        # Ngưỡng 0.5 từ notebook (1 là Real, 0 là Spoof)
        if liveness_score < 0.5:
            print(f"DEBUG: Spoofing detected! Score: {liveness_score:.4f}")
            return {
                "name": "FAKE FACE", "conf": 0, "attendance_status": "CẢNH BÁO GIẢ MẠO",
                "bbox": {
                    "x": (bbox.origin_x / w_orig) * 100, "y": (bbox.origin_y / h_orig) * 100,
                    "w": (bbox.width / w_orig) * 100, "h": (bbox.height / h_orig) * 100
                }
            }

        # D. Trích xuất Embedding (Nếu là người thật)
        face_resized = cv2.resize(face_crop, (160, 160))
        face_tensor = (torch.tensor(face_resized).permute(2, 0, 1).float().unsqueeze(0).to(device) - 127.5) / 128.0
        with torch.no_grad():
            current_embed = facenet_model(face_tensor).cpu().numpy().flatten()

        # E. So sánh Database
        conn = get_db_connection();
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, face_embedding FROM users WHERE face_embedding IS NOT NULL")
        rows = cur.fetchall()

        identity, user_id_found, min_dist = "Unknown", None, 1.0
        for uid, name, db_embed in rows:
            dist = np.linalg.norm(current_embed - np.array(db_embed))
            if dist < min_dist:
                min_dist = dist
                if dist < 0.85: identity, user_id_found = name, uid

        # F. Logic Điểm danh (6-8h, 8-10h)
        attendance_status = ""
        if user_id_found:
            now = datetime.now()
            cur_time = now.time()
            today = now.date()

            # Kiểm tra trạng thái đã lưu trong ngày
            cur.execute("SELECT status FROM attendance WHERE user_id = %s AND check_in_time::date = %s",
                        (user_id_found, today))
            check_exist = cur.fetchone()

            if check_exist:
                saved_status = check_exist[0]
                attendance_status = "BẠN ĐÃ ĐÚNG GIỜ" if saved_status == 'Success' else "BẠN ĐÃ ĐI MUỘN"
            else:
                if IN_START <= cur_time <= IN_END:
                    status = "Success" if cur_time <= IN_LATE else "Late"
                    cur.execute("INSERT INTO attendance (user_id, confidence, status) VALUES (%s, %s, %s)",
                                (user_id_found, float(1 - min_dist), status))
                    conn.commit()
                    attendance_status = "ĐIỂM DANH THÀNH CÔNG" if status == "Success" else "BẠN ĐI MUỘN"
                else:
                    attendance_status = "HẾT GIỜ ĐIỂM DANH"

        cur.close()
        return {
            "name": identity,
            "conf": float(1 - min_dist) if identity != "Unknown" else 0,
            "attendance_status": attendance_status,
            "bbox": {
                "x": (bbox.origin_x / w_orig) * 100, "y": (bbox.origin_y / h_orig) * 100,
                "w": (bbox.width / w_orig) * 100, "h": (bbox.height / h_orig) * 100
            }
        }
    except Exception as e:
        print(f"Lỗi: {e}")
        return {"name": "Unknown", "conf": 0, "bbox": None, "attendance_status": ""}
    finally:
        if conn: conn.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)