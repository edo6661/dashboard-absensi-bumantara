import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './pages/PageLoader';
import RootLayout from './components/layouts/RootLayout';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

const Login = lazy(() => import('./pages/Login'));
// Menggunakan Dashboard sebagai halaman utama
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AttendanceRecap = lazy(() => import('./pages/Attendance/AttendanceRecap'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="attendance/recap" element={<AttendanceRecap />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;