import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus, Trash2, Search, User, ShieldCheck,
  Fingerprint, ChevronLeft, ChevronRight, Users, UserCheck, Clock,
  X, Camera, Check, RefreshCw, Loader2
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrollData, setEnrollData] = useState({ name: '', id: '', dept: '', images: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Lỗi kết nối API:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const startEnrollment = async () => {
    setShowModal(true);
    setEnrollData({ name: '', id: '', dept: '', images: [] });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Không thể mở Camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowModal(false);
  };

  const captureFrame = () => {
    if (enrollData.images.length < 5 && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setEnrollData(prev => ({ ...prev, images: [...prev.images, imageData] }));
    }
  };

  const handleSaveToDB = async () => {
    const { name, id, dept, images } = enrollData;
    if (!name || !id || !dept || images.length < 5) {
      alert("Vui lòng nhập đủ thông tin và 5 ảnh!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollData)
      });
      if (res.ok) {
        alert(`✅ Đã đăng ký thành công!`);
        stopCamera();
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`❌ Lỗi: ${err.detail}`);
      }
    } catch (error) {
      alert("❌ Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <style>{`
        .custom-scroll-clean::-webkit-scrollbar { width: 4px; }
        .custom-scroll-clean::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-clean::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
      `}</style>

      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Tổng nhân sự', val: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Đã xác thực', val: users.filter(u => u.is_verified).length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Mới trong tháng', val: '+1', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={18} /></div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-12 text-xs text-white focus:border-blue-500/40 outline-none transition-all shadow-2xl"
          />
        </div>
        <button onClick={startEnrollment} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
          <UserPlus size={16} /> Thêm nhân sự
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll-clean pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 content-start pb-4">
          {currentUsers.map((user) => (
            <div key={user.id} className="group relative bg-slate-950/40 border border-white/5 p-5 rounded-2xl hover:border-blue-500/40 transition-all h-[240px] flex flex-col justify-between shadow-xl overflow-hidden">
              <div className="z-10">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-white/5 flex items-center justify-center text-blue-500 overflow-hidden shadow-inner">
                    {user.image_path ? (
                      <img
                        src={`http://localhost:8000/${user.image_path}/${user.id}_1.jpg`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                        }}
                      />
                    ) : (
                      <User size={24} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {user.is_verified && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                        <ShieldCheck size={9} className="text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">Verified</span>
                      </div>
                    )}
                    <span className="text-[9px] font-mono text-slate-600 font-bold">{user.id}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">{user.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{user.dept}</p>
                </div>
              </div>
              <div className="z-10 flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5 transition-all">Chi tiết</button>
                <button className="p-2.5 bg-red-500/5 hover:bg-red-500/20 rounded-lg text-red-500 border border-red-500/10 transition-all"><Trash2 size={14} /></button>
              </div>
              <Fingerprint className="absolute -right-6 -bottom-6 opacity-[0.02] group-hover:opacity-[0.08] text-blue-500 transition-all duration-700 rotate-12" size={120} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 bg-slate-950/30 border border-white/5 rounded-xl shrink-0">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
          Hiển thị {currentUsers.length} / {filteredUsers.length} nhân sự
        </p>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className={`p-2 rounded-lg border border-white/5 transition-colors ${currentPage === 1 ? 'text-slate-800' : 'text-slate-500 hover:bg-white/10'}`}
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex gap-1 items-center">
            {[...Array(totalPages)].map((_, i) => (
              <span
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black cursor-pointer transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className={`p-2 rounded-lg border border-white/5 transition-colors ${currentPage === totalPages ? 'text-slate-800' : 'text-slate-500 hover:bg-white/10'}`}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[520px]">
            <div className="w-full md:w-1/2 bg-black relative flex items-center justify-center border-r border-white/5">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border border-blue-500/40 rounded-3xl"></div>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Cấy dữ liệu khuôn mặt</h3>
                  <button onClick={stopCamera} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="name" value={enrollData.name} onChange={(e) => setEnrollData({ ...enrollData, name: e.target.value })} placeholder="Họ tên..." className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500/50 outline-none" />
                  <input name="id" value={enrollData.id} onChange={(e) => setEnrollData({ ...enrollData, id: e.target.value })} placeholder="ID (NV001)..." className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500/50 outline-none" />
                  <input name="dept" value={enrollData.dept} onChange={(e) => setEnrollData({ ...enrollData, dept: e.target.value })} placeholder="Phòng ban (AI Dept)..." className="col-span-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500/50 outline-none" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bộ nhớ ({enrollData.images.length}/5)</p>
                    <button onClick={() => setEnrollData({ ...enrollData, images: [] })} className="text-[8px] font-black text-blue-500 uppercase hover:underline flex items-center gap-1"><RefreshCw size={10} /> Xóa hết</button>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 aspect-[3/4] rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all ${enrollData.images[i] ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-white/5 bg-white/5'}`}>
                        {enrollData.images[i] ? <img src={enrollData.images[i]} className="w-full h-full object-cover animate-in zoom-in-75 duration-300" /> : <Camera size={14} className="text-slate-800" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-6">
                {enrollData.images.length < 5 ? (
                  <button onClick={captureFrame} className="w-full py-4 bg-white text-black hover:bg-blue-600 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl">
                    Chụp tấm {enrollData.images.length + 1}
                  </button>
                ) : (
                  <button disabled={loading} onClick={handleSaveToDB} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    {loading ? 'Đang trích xuất AI...' : 'Lưu vào hệ thống'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;