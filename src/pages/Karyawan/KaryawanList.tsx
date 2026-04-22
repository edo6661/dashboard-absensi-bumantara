import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Filter, Maximize2, UserCircle2 } from 'lucide-react';

import DataTable from '../../components/shared/DataTable';
import Select from '../../components/shared/Select';
import Modal from '../../components/shared/Modal';
import { userService } from '../../services/user.service';
import type { User, UserFilterParams } from '../../types/models/user';
import UserEditModal from './components/UserEditModal';

const KaryawanList = () => {
  const [filters, setFilters] = useState<UserFilterParams>({
    limit: 10,
    search: '',
    role: '',
    status: '',
    cursor: undefined,
  });

  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);


  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['users-list', filters],
    queryFn: () => userService.getUsers(filters),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, cursor: undefined }));
    setCursorHistory([]);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, cursor: undefined }));
    setCursorHistory([]);
  };

  const handleNextPage = () => {
    if (data?.meta?.nextCursor) {
      setCursorHistory(prev => [...prev, filters.cursor || '']);
      setFilters(prev => ({ ...prev, cursor: data.meta.nextCursor! }));
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setFilters(prev => ({ ...prev, cursor: prevCursor === '' ? undefined : prevCursor }));
    }
  };

  const columns = [
    {
      header: 'Karyawan',
      accessor: 'name',
      render: (val: string, row: User) => (
        <div className='flex items-center gap-3'>
          <div
            className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 shadow-sm ${row.registeredFaceUrl ? 'cursor-pointer group' : ''}`}
            onClick={() => {
              if (row.registeredFaceUrl) setPreviewImage(row.registeredFaceUrl);
            }}
          >
            {row.registeredFaceUrl ? (
              <>
                <img src={row.registeredFaceUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <Maximize2 size={16} className="text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <UserCircle2 size={24} className="text-slate-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800">{val}</p>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5">{row.nik || 'No NIK'} </p>
          </div>
        </div>
      )
    },
    {
      header: 'Perusahaan',
      accessor: 'perusahaanNama',
      render: (val: string | null) => (
        <span className="text-[13px] font-bold text-slate-600">
          {val || 'Pusat / Internal'}
        </span>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (val: string) => (
        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md tracking-wider">
          {val}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md tracking-wide ${val === 'TETAP' ? 'bg-emerald-100/60 text-emerald-700' : 'bg-amber-100/60 text-amber-700'}`}>
          {val === 'TETAP' ? 'TETAP' : 'KONTRAK'}
        </span>
      )
    },
    {
      header: 'Kontrak Ke',
      accessor: 'kontrak',
      render: (val: number) => (
        <span className="font-bold text-slate-700">{val || 1}</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Users size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Karyawan</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Kelola data, role, dan kontrak seluruh staf.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-[15px] font-bold text-slate-800">Filter Pencarian</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Select
            label="Filter Role"
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'Semua Role' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'PENGAWAS', label: 'Pengawas' },
              { value: 'MANDOR', label: 'Mandor' },
              { value: 'PEKERJA', label: 'Pekerja' },
              { value: 'KARYAWAN', label: 'Karyawan' },
            ]}
          />
          <Select
            label="Filter Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'TETAP', label: 'Tetap' },
              { value: 'TIDAK_TETAP', label: 'Kontrak / Tidak Tetap' }
            ]}
          />
        </div>
      </div>

      <DataTable
        title="Daftar Karyawan"
        columns={columns}
        data={data?.items || []}
        serverSide
        searchTerm={filters.search}
        onSearchChange={handleSearch}
        onEdit={(row: User) => setSelectedUser(row)}
        hasNextPage={data?.meta?.hasNextPage}
        hasPrevPage={cursorHistory.length > 0}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      <UserEditModal
        key={selectedUser ? selectedUser.id : 'empty-modal'}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Preview Foto Karyawan"
      >
        {previewImage && (
          <div className="flex justify-center items-center bg-slate-100 rounded-2xl overflow-hidden border-[6px] border-white shadow-lg p-2">
            <img
              src={previewImage}
              alt="Preview Full"
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
            />
          </div>
        )}
      </Modal>

    </div>
  );
};

export default KaryawanList;