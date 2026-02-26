import React, { useRef, useEffect, useState } from 'react';
import {
  Camera, Activity, Terminal, CheckCircle2, AlertCircle,
  Scan, Monitor, Cpu, HardDrive, Gauge, Power, ChevronDown
} from 'lucide-react';

const formatDisplayName = (str) => {
  if (!str) return "SCANNING...";
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();
};

const CameraMonitor = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    async function toggleWebcam() {
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 }
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          setStreamError(null);
        } catch (err) {
          console.error("Camera Error:", err);
          setStreamError("Không thể truy cập Camera.");
          setIsCameraOn(false);
        }
      } else {
        stopCamera();
      }
    }

    toggleWebcam();
    return () => stopCamera();
  }, [isCameraOn]);

  useEffect(() => {
    let interval;
    if (isCameraOn) {
      interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        const base64Image = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const res = await fetch('http://localhost:8000/api/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
          });
          const data = await res.json();
          setRecognition(data);
        } catch (err) {
          console.error("Lỗi AI Inference:", err);
        }
      }, 500);
    } else {
      setRecognition(null);
    }
    return () => clearInterval(interval);
  }, [isCameraOn]);

  const aiLogs = [
    { id: 1, time: '10:35:42', user: 'Nguyễn Văn A', status: 'Success', conf: 0.98, type: 'FACEID' },
    { id: 2, time: '10:35:45', user: 'Trần Thị B', status: 'Success', conf: 0.95, type: 'FACEID' },
    { id: 3, time: '10:36:10', user: 'Unknown', status: 'Denied', conf: 0.42, type: 'STRANGER' },
    { id: 4, time: '10:38:22', user: 'Lê Văn C', status: 'Success', conf: 0.91, type: 'FACEID' },
    { id: 5, time: '10:40:05', user: 'Phạm Văn D', status: 'Success', conf: 0.89, type: 'FACEID' },
    { id: 6, time: '10:42:10', user: 'Hoàng Anh E', status: 'Success', conf: 0.94, type: 'FACEID' },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px; 
        }
        .custom-scroll:hover::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); }
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(800%); } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-8 flex flex-col space-y-4 min-h-0">
          <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/5 bg-slate-950 shadow-2xl min-h-0 group">
            <div className="absolute top-0 left-0 right-0 p-5 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all pointer-events-auto ${isCameraOn ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                    }`}
                >
                  <Power size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isCameraOn ? 'Stop AI' : 'Start AI'}</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group/select">
                  <Monitor size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-white/80">Webcam Integrated</span>
                  <ChevronDown size={12} className="text-slate-500" />
                </div>
              </div>
            </div>

            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
              {!isCameraOn ? (
                <div className="flex flex-col items-center gap-4 text-slate-600 animate-pulse">
                  <Monitor size={64} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">System Standby</p>
                </div>
              ) : streamError ? (
                <div className="text-center space-y-2">
                  <AlertCircle size={32} className="text-red-500 mx-auto" />
                  <p className="text-xs text-red-400">{streamError}</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  {recognition && recognition.bbox && (
                    <div
                      className={`absolute border-2 rounded-2xl transition-all duration-200 shadow-2xl ${recognition.name !== 'Unknown' ? 'border-blue-500/60 shadow-blue-500/30' : 'border-red-500/60 shadow-red-500/30'
                        }`}
                      style={{
                        top: `${recognition.bbox.y}%`,
                        left: `${100 - recognition.bbox.x - recognition.bbox.w}%`,
                        width: `${recognition.bbox.w}%`,
                        height: `${recognition.bbox.h}%`
                      }}
                    >
                      <div className="absolute -top-14 left-0 flex flex-col gap-1 items-start">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap ${recognition.name !== 'Unknown' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                          {recognition.name.toUpperCase()}
                        </span>

                        {recognition.attendance_status && (
                          <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-md animate-pulse whitespace-nowrap">
                            {recognition.attendance_status}
                          </span>
                        )}

                        <span className="bg-black/60 backdrop-blur-md text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                          MATCH: {(recognition.conf * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-24 w-full animate-scan pointer-events-none"></div>
                </>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                <button className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-blue-600 rounded-xl border border-white/10 text-white transition-all"><Camera size={16} /></button>
                <button className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-blue-600 rounded-xl border border-white/10 text-white transition-all"><Scan size={16} /></button>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">AI Status</p>
                <p className={`text-[10px] font-black ${isCameraOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isCameraOn ? 'ACTIVE' : 'IDLE'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-20 grid grid-cols-3 gap-4 shrink-0">
            {[
              { label: 'Neural Engine', val: '1.2 TFLOPS', icon: Cpu, color: 'text-amber-400' },
              { label: 'Inference', val: recognition ? '24ms' : '0ms', icon: Activity, color: 'text-blue-400' },
              { label: 'Temp', val: '42°C', icon: Gauge, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 px-4 flex items-center gap-3 rounded-[1.5rem]">
                <div className={`p-2.5 rounded-xl bg-white/5 ${stat.color}`}><stat.icon size={16} /></div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{stat.label}</p>
                  <p className="text-xs font-black text-white">{stat.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 flex flex-col space-y-4 min-h-0">
          <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-[2rem] p-5 backdrop-blur-2xl flex flex-col min-h-0 shadow-2xl">
            <div className="flex items-center justify-between mb-4 shrink-0 text-white/90 font-black text-[10px] uppercase tracking-widest">
              Live Event Stream
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll min-h-0">
              {aiLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{log.type}</span>
                    <span className="text-[9px] font-mono text-slate-600">{log.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-white/50 text-[10px] font-bold">{log.user.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{log.user}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${log.conf * 100}%` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-blue-400">{(log.conf * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-32 bg-blue-600 rounded-[2rem] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start text-white/60 text-[10px] font-black uppercase relative z-10">Efficiency</div>
            <div className="flex items-end gap-1.5 h-12 relative z-10">
              {[40, 70, 45, 90, 65, 85, 100, 75, 55, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-white/30 rounded-t-sm transition-all group-hover:bg-white/50" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraMonitor;