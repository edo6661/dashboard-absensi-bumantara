import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../components/shared/Modal';
import Input from '../../../components/shared/Input';
import Select from '../../../components/shared/Select';
import { userService } from '../../../services/user.service';
import type { User } from '../../../types/models/user';
import { Loader2 } from 'lucide-react';
import api from '../../../lib/axios';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserEditModal = ({ isOpen, onClose, user }: UserEditModalProps) => {
  const queryClient = useQueryClient();

  // Ambil data perusahaan dari backend
  const { data: companies } = useQuery({
    queryKey: ['perusahaan'],
    queryFn: async () => (await api.get('/perusahaan')).data.data
  });

  // BEST PRACTICE: Inisialisasi state langsung. 
  // State ini akan otomatis di-reset oleh React karena kita akan menggunakan prop 'key' di parent component.
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    nik: user?.nik || '',
    role: user?.role || 'PEKERJA',
    status: user?.status || 'TETAP',
    kontrak: user?.kontrak || 1,
    perusahaanId: user?.perusahaanId || '',
    password: '', // Opsional, dikosongkan secara default
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("No user selected");

      const payload: Record<string, any> = { ...data };

      // Hapus password jika kosong agar tidak diupdate di backend
      if (!payload.password) delete payload.password;

      // Jika perusahaan kosong (Pusat), set menjadi null agar diterima oleh Prisma
      if (!payload.perusahaanId) payload.perusahaanId = null;

      return userService.updateUser(user.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      onClose();
    },
    onError: (error) => {
      alert("Gagal mengupdate data. Silakan coba lagi.");
      console.error(error);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!user) return null;

  // Format opsi dropdown untuk perusahaan
  const companyOptions = [
    { value: '', label: 'Pilih Perusahaan (Kosongkan jika di Pusat)' },
    ...(companies?.map((c: any) => ({ value: c.id, label: c.nama })) || [])
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Data Karyawan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nama Lengkap" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="NIK" name="nik" value={formData.nik} onChange={handleChange} required />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
          <Input
            label="Password Baru (Opsional)"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Biarkan kosong jika tidak ingin diubah"
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'PENGAWAS', label: 'Pengawas' },
              { value: 'MANDOR', label: 'Mandor' },
              { value: 'PEKERJA', label: 'Pekerja' },
            ]}
          />
          <Select
            label="Perusahaan"
            name="perusahaanId"
            value={formData.perusahaanId}
            onChange={handleChange}
            options={companyOptions}
          />
          <Select
            label="Status Karyawan"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'TETAP', label: 'Tetap' },
              { value: 'TIDAK_TETAP', label: 'Tidak Tetap / Kontrak' },
            ]}
          />
          <Input
            label="Jumlah Kontrak"
            type="number"
            name="kontrak"
            value={formData.kontrak}
            onChange={handleChange}
            min={1}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
            Batal
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-70"
          >
            {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;