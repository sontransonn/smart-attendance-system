import React, { useState, useEffect } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, Download, Users, UserCheck, ShieldAlert
} from 'lucide-react';

const AttendanceRecord = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/attendance/logs');
      if (res.ok) setLogs(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l =>
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  return (
    <div className="h-full flex flex-col min-h-0 animate-in fade-in duration-700 space-y-4">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>

      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Tổng lượt quét', val: logs.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Xác thực khớp', val: logs.filter(l => l.status === 'Success').length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Cảnh báo lạ', val: logs.filter(l => l.status !== 'Success').length, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-inner`}><stat.icon size={20} /></div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-white leading-none">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-[10px] text-white outline-none focus:bg-slate-900/60 focus:border-blue-500/40 transition-all shadow-2xl placeholder:text-slate-800"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="flex-1 overflow-y-auto custom-scroll">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="px-8 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Nhân sự</th>
                <th className="px-8 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Phòng ban</th>
                <th className="px-8 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Thời gian quét</th>
                <th className="px-8 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Độ tin cậy</th>
                <th className="px-8 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {currentLogs.map((log, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-3.5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-center text-blue-500/40 font-black text-[10px]">{log.user.charAt(0)}</div>
                      <div>
                        <p className="text-[11px] font-black text-white group-hover:text-blue-400 transition-colors leading-tight">{log.user}</p>
                        <p className="text-[7px] text-slate-700 font-black tracking-widest uppercase mt-0.5">{log.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-3.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{log.dept}</td>
                  <td className="px-8 py-3.5 text-[10px] font-bold text-slate-400 text-center">{log.time}</td>
                  <td className="px-8 py-3.5">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-20 h-0.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/40" style={{ width: `${log.conf * 100}%` }}></div>
                      </div>
                      <span className="text-[8px] font-black text-slate-700">{(log.conf * 100).toFixed(0)}% Match</span>
                    </div>
                  </td>
                  <td className="px-8 py-3.5 text-right">
                    {(() => {
                      const statusConfig = {
                        'Success': {
                          text: 'ĐÚNG GIỜ',
                          color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        },
                        'Late': {
                          text: 'ĐI MUỘN',
                          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        },
                        'Out': {
                          text: 'CHECK-OUT',
                          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }
                      };

                      const currentStatus = statusConfig[log.status] || {
                        text: log.status?.toUpperCase() || 'UNKNOWN',
                        color: 'bg-slate-500/10 text-slate-500 border-white/5'
                      };

                      return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${currentStatus.color}`}>
                          {log.status === 'Success' ? (
                            <CheckCircle2 size={10} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          <span className="text-[8px] font-black uppercase tracking-tighter">
                            {currentStatus.text}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. PHÂN TRANG - Đồng bộ 100% với Quản lý nhân sự */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/30 border-t border-white/5 shrink-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
            Hiển thị {currentLogs.length} / {filteredLogs.length} bản ghi
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`p-2 rounded-lg border border-white/5 transition-all ${currentPage === totalPages ? 'text-slate-800' : 'text-slate-500 hover:bg-white/10'}`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecord;