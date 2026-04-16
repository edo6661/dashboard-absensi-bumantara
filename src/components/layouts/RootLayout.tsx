import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

const RootLayout = () => {
  return (
    <div className="flex min-h-screen bg-[var(--theme-background)]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;