import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rekap Absensi', path: '/attendance/recap', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-sidebar-bg border-r border-sidebar-border h-screen sticky top-0 flex flex-col transition-colors duration-300 shadow-[4px_0_24px_rgb(0,0,0,0.01)]">
      <div className="p-6">
        <div className="flex items-center gap-3.5 mb-10 text-slate-900">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-slate-900/20">
            B
          </div>
          <span className="font-black text-xl tracking-tight">Bumantara</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 ${isActive
                  ? 'bg-sidebar-active-bg text-sidebar-active-text shadow-md shadow-slate-900/5'
                  : 'text-sidebar-text hover:bg-sidebar-hover-bg hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border bg-slate-50/50">
        <button
          onClick={logout}
          className="flex items-center gap-3.5 px-4 py-3 w-full text-left rounded-xl text-[13px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;