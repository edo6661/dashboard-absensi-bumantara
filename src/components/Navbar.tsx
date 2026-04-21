// src/components/Navbar.tsx
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.includes('/attendance/recap')) return 'Rekap Absensi';
    return 'Bumantara ERP';
  };

  return (
    <header className="h-[70px] sm:h-[76px] px-4 sm:px-8 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm/50 transition-all">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Tombol Hamburger untuk Mobile */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-xl md:hidden transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight line-clamp-1">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
};

export default Navbar;