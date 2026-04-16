import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/shared/Input';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState('');

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      if (result.errors && Array.isArray(result.errors)) {
        const fieldErrors = result.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {} as Record<string, string>);
        setErrors(fieldErrors);
      } else {
        setGeneralError(result.message || 'Kredensial tidak valid. Silakan coba lagi.');
      }
    }
  };

  return (
    // Background menggunakan gradien lembut yang tidak merusak mata
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-4">

      <div className="max-w-md w-full bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.1)] border border-indigo-50 p-8 sm:p-12">

        <div className="text-center mb-10">
          {/* Logo dengan gradien warna biru/indigo */}
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-[14px] mx-auto flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20 mb-6 tracking-tighter">
            B
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bumantara</h1>
          <p className="text-[13px] text-slate-500 mt-2 font-medium">Sistem Manajemen & Absensi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {generalError && (
            <div className="p-4 bg-red-50/80 text-red-600 text-[13px] font-semibold rounded-xl border border-red-100 flex items-center justify-center animate-in fade-in slide-in-from-top-2">
              {generalError}
            </div>
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="admin@bumantara.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={isLoading}
            // Tombol menggunakan warna Indigo yang modern
            className={`w-full bg-indigo-600 text-white font-bold text-[13px] uppercase tracking-wider py-4 rounded-xl transition-all duration-300 mt-8 flex justify-center items-center gap-2 
            ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'}`}
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Memproses...</>
            ) : (
              'Masuk Sistem'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;