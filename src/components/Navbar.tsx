// src/components/Navbar.tsx
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.includes('/attendance/recap')) return 'Rekap Absensi';
    return 'Bumantara ERP';
  };

  return (
    <header className="h-[76px] px-8 flex items-center justify-between bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm/50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
};

export default Navbar;