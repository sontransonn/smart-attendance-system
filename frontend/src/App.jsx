import React, { useState } from 'react';
import {
  LayoutDashboard, Users, History, ShieldCheck, Bell, 
  Settings as SettingsIcon, BarChart3, HelpCircle, 
  Map, Cpu, Activity, Zap
} from 'lucide-react';

import CameraMonitor from './components/CameraMonitor';
import UserManagement from './components/UserManagement';
import AttendanceRecord from './components/AttendanceRecord';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import HelpSupport from './components/HelpSupport';

function App() {
  const [activeTab, setActiveTab] = useState('camera');

  const headerTitles = {
    camera: "Giám sát Camera Real-time",
    persons: "Cơ sở dữ liệu nhân sự",
    attendance: "Nhật ký truy cập",
    analytics: "Phân tích lưu lượng",
    heatmap: "Bản đồ mật độ (Heatmap)",
    aimodels: "Cấu hình Model AI",
    settings: "Tham số hệ thống",
    supports: "Tài liệu kỹ thuật"
  };

  const headerSubtitles = {
    camera: "Luồng video trực tiếp và nhận diện thực thể",
    persons: "Đồng bộ hóa dữ liệu định danh khuôn mặt",
    attendance: "Lịch sử check-in/out chi tiết",
    analytics: "Biểu đồ tăng trưởng và hiệu suất nhận diện",
    heatmap: "Theo dõi vùng hoạt động cao trong khu vực",
    aimodels: "Quản lý phiên bản và độ chính xác của Model",
    settings: "Cấu hình Network, API và Security",
    supports: "Tra cứu hướng dẫn vận hành hệ thống"
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'camera': return <CameraMonitor />;
      case 'persons': return <UserManagement />;
      case 'attendance': return <AttendanceRecord />;
      case 'analytics': return <Analytics />;
      case 'settings': return <Settings />;
      case 'supports': return <HelpSupport />;
      // Các tab mới có thể trả về Dashboard hoặc Placeholder
      default: return <CameraMonitor />;
    }
  };

  const NavButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border
          ${isActive
            ? 'bg-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] border-blue-400/50 z-10'
            : 'bg-white/[0.03] backdrop-blur-md text-slate-400 border-white/[0.05] hover:bg-white/[0.08] hover:text-slate-200 hover:border-white/10'
          }
        `}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
        <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-950/50 backdrop-blur-2xl flex flex-col border-r border-white/5">
        <div className="h-[78.4px] flex items-center gap-3 px-4 border-b border-white/5">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest uppercase text-white">Smart</span>
            <span className="text-[10px] font-bold text-blue-500 tracking-[0.3em] uppercase -mt-1">System AI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Giám sát & Quản lý</p>
            <div className="space-y-1.5">
              <NavButton id="camera" icon={LayoutDashboard} label="Giám sát Camera" />
              <NavButton id="persons" icon={Users} label="Quản lý Nhân sự" />
              <NavButton id="attendance" icon={History} label="Nhật ký Điểm danh" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Trí tuệ nhân tạo</p>
            <div className="space-y-1.5">
              <NavButton id="analytics" icon={BarChart3} label="Thống kê" />
              <NavButton id="heatmap" icon={Map} label="Bản đồ nhiệt" />
              <NavButton id="aimodels" icon={Cpu} label="Model AI" />
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Hệ thống</p>
            <div className="space-y-1.5">
              <NavButton id="settings" icon={SettingsIcon} label="Cài đặt" />
              <NavButton id="supports" icon={HelpCircle} label="Hỗ trợ & Tài liệu" />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/30">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Server: Stable (240ms)</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-900 to-slate-950">
        <header className="h-[78.4px] bg-slate-900/40 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-50">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white uppercase italic">
              {headerTitles[activeTab] || activeTab}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {headerSubtitles[activeTab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 px-6 py-2 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">CPU</span>
                <span className="text-xs font-black text-blue-400">12%</span>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">RAM</span>
                <span className="text-xs font-black text-indigo-400">2.4GB</span>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Uptime</span>
                <span className="text-xs font-black text-emerald-400">14d</span>
              </div>
            </div>

            <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900"></span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all group">
              <Zap size={16} className="fill-current" />
              <span className="text-xs font-bold uppercase tracking-wider">Quick Action</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;