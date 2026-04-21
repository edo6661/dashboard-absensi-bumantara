// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, X, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rekap Absensi', path: '/attendance/recap', icon: ClipboardList },
    { name: 'Karyawan', path: '/users', icon: Users },
  ];

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200/80 h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] md:shadow-none transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="p-6">
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5 text-slate-900 cursor-pointer group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
              B
            </div>
            <div>
              <span className="font-black text-xl tracking-tight leading-none block text-slate-800">Bumantara</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">ERP System</span>
            </div>
          </div>
          {/* Tombol Tutup Sidebar untuk Mobile */}
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Menu Utama</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 relative overflow-hidden ${isActive
                  ? 'bg-indigo-50/80 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"></span>
                )}
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600' : 'group-hover:scale-110 group-hover:text-slate-700'}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="mt-auto p-6 border-t border-slate-50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3.5 py-3 w-full text-left rounded-xl text-[14px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={20} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;