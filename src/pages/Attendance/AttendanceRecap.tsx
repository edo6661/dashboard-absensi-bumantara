import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, Loader2, MapPin, Maximize2, UserCircle2, Filter } from 'lucide-react';

import { useAttendanceHistory } from '../../hooks/useAttendance';
import api from '../../lib/axios';
import DataTable from '../../components/shared/DataTable';
import Select from '../../components/shared/Select';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import { formatDate } from '../../utils/formatters';
import type { Attendance, AttendanceHistoryParams } from '../../types/models/attendance';
import { attendanceService } from '../../services/attendance.service';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const AttendanceRecap = () => {
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles')).data.data });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: async () => (await api.get('/projects')).data.data });
  const { data: companies } = useQuery({ queryKey: ['perusahaan'], queryFn: async () => (await api.get('/perusahaan')).data.data });

  const [filters, setFilters] = useState<AttendanceHistoryParams>({
    limit: 10, page: 1, search: '', type: '', sortOrder: 'desc',
    startDate: getTodayDateString(), endDate: getTodayDateString(),
    role: '', projectId: '', perusahaanId: '',
  });

  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data } = useAttendanceHistory(filters);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExportExcel = async () => {
    try {
      const exportParams = { ...filters, limit: 10000, page: 1 };

      // PERBAIKAN: Gunakan attendanceService agar format ISO otomatis tertangani
      const response = await attendanceService.getHistory(exportParams);
      const allItems: Attendance[] = response.items;

      if (!allItems.length) {
        alert("Tidak ada data untuk di-export");
        return;
      }

      const headers = ['Nama', 'NIK', 'Tipe', 'Waktu', 'Proyek', 'Lokasi'];
      const rows = allItems.map(item => [
        `"${item.userName}"`,
        `="${item.userNik || '-'}"`,
        `"${item.type === 'IN' ? 'MASUK' : 'KELUAR'}"`,
        `"${formatDate(item.recordedAt)}"`,
        `"${item.projectName || '-'}"`,
        `"${item.latitude || ''}, ${item.longitude || ''}"`
      ].join(','));

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap_Absensi_${filters.startDate}.csv`;
      link.click();
    } catch (error) {
      console.error("Gagal export Excel", error);
      alert("Terjadi kesalahan saat mengunduh data.");
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const exportParams = { ...filters, limit: 10000, page: 1 };

      // PERBAIKAN: Gunakan attendanceService agar format ISO otomatis tertangani
      const response = await attendanceService.getHistory(exportParams);
      const allItems: Attendance[] = response.items;

      if (!allItems.length) {
        alert("Tidak ada data untuk di-export");
        setIsExportingPDF(false);
        return;
      }

      const pdf = new jsPDF('p', 'pt', 'a4');

      pdf.setFontSize(16);
      pdf.text('Laporan Rekap Absensi', 40, 40);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Periode: ${filters.startDate} s/d ${filters.endDate}`, 40, 55);

      const tableData = allItems.map(item => [
        item.userName,
        item.userNik || '-',
        item.type === 'IN' ? 'MASUK' : 'KELUAR',
        formatDate(item.recordedAt),
        item.projectName || 'Pusat'
      ]);

      autoTable(pdf, {
        startY: 70,
        head: [['Nama Pegawai', 'NIK', 'Status', 'Waktu', 'Proyek/Lokasi']],
        body: tableData,
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 6 },
      });

      pdf.save(`Rekap_Absensi_${filters.startDate}.pdf`);
    } catch (error) {
      console.error("Gagal export PDF", error);
      alert("Terjadi kesalahan saat men-generate PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };
  const columns = [
    {
      header: 'Preview',
      accessor: 'capturedImageUrl',
      render: (val: string, row: Attendance) => (
        <div
          className="relative w-11 h-11 rounded-lg overflow-hidden cursor-pointer group border border-slate-200/80 shadow-sm"
          onClick={() => setSelectedAttendance(row)}
        >
          {val ? (
            <img src={val} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <UserCircle2 className="text-slate-400" size={24} />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <Maximize2 size={16} className="text-white" />
          </div>
        </div>
      ),
    },
    {
      header: 'Pegawai',
      accessor: 'userName',
      render: (val: string, row: Attendance) => (
        <div className="cursor-pointer group" onClick={() => setSelectedAttendance(row)}>
          <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{val}</p>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">{row.userRole} <span className="mx-1 text-slate-300">•</span> {row.userNik || 'No NIK'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'type',
      render: (val: string) => (
        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md tracking-wide ${val === 'IN' ? 'bg-emerald-100/60 text-emerald-700' : 'bg-amber-100/60 text-amber-700'}`}>
          {val === 'IN' ? 'MASUK' : 'KELUAR'}
        </span>
      )
    },
    {
      header: 'Waktu',
      accessor: 'recordedAt',
      render: (val: string) => <span className="text-[13px] font-semibold text-slate-700">{formatDate(val)}</span>
    },
    {
      header: 'Proyek',
      accessor: 'projectName',
      render: (val: string) => <span className="text-[13px] font-medium text-slate-600">{val || '-'}</span>
    }
  ];

  // Logic aman untuk mendeteksi total halaman
  const totalPages = data?.meta?.total
    ? Math.ceil(data.meta.total / (filters.limit || 10))
    : (data?.meta?.lastPage || 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white px-8 py-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rekap Absensi</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Sistem pemantauan kehadiran real-time.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[13px] text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
            <FileSpreadsheet size={16} className="text-emerald-600" /> Export Excel
          </button>
          <button onClick={handleExportPDF} disabled={isExportingPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-[13px] hover:bg-slate-900 shadow-md transition-all active:scale-95 disabled:opacity-70">
            {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Cetak PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-[15px] font-bold text-slate-800">Filter Data</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Input label="Mulai" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          <Input label="Selesai" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          <Select label="Tipe" name="type" value={filters.type} onChange={handleFilterChange} options={[{ value: '', label: 'Semua Tipe' }, { value: 'IN', label: 'Masuk' }, { value: 'OUT', label: 'Keluar' }]} />
          <Select label="Perusahaan" name="perusahaanId" value={filters.perusahaanId} onChange={handleFilterChange} options={[{ value: '', label: 'Semua' }, ...(companies?.map((c: any) => ({ value: c.id, label: c.nama })) || [])]} />
          <Select label="Proyek" name="projectId" value={filters.projectId} onChange={handleFilterChange} options={[{ value: '', label: 'Semua' }, ...(projects?.map((p: any) => ({ value: p.id, label: p.name })) || [])]} />
          <Select label="Jabatan" name="role" value={filters.role} onChange={handleFilterChange} options={[{ value: '', label: 'Semua' }, ...(roles?.map((r: any) => ({ value: r.name, label: r.name })) || [])]} />
        </div>
      </div>

      <div>
        <DataTable
          title="Log Kehadiran"
          columns={columns}
          data={data?.items || []}
          serverSide
          searchTerm={filters.search}
          onSearchChange={(s) => setFilters(f => ({ ...f, search: s, page: 1 }))}
          page={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal isOpen={!!selectedAttendance} onClose={() => setSelectedAttendance(null)} title="Detail Validasi Kehadiran">
        {selectedAttendance && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/5">
              <div className="rounded-2xl overflow-hidden border-[6px] border-white shadow-lg aspect-[3/4] bg-slate-100 relative">
                {selectedAttendance.capturedImageUrl ? (
                  <img src={selectedAttendance.capturedImageUrl} className="w-full h-full object-cover" alt="Captured Biometric" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col text-slate-400 gap-3">
                    <UserCircle2 size={56} strokeWidth={1.5} />
                    <span className="text-sm font-medium">Foto tidak tersedia</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence Score</span>
                  <span className="text-sm font-black text-slate-800">{selectedAttendance.confidence ? `${(selectedAttendance.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-5">
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedAttendance.userName}</h2>
                    <p className="font-semibold text-slate-500 mt-1 text-sm">{selectedAttendance.userRole} <span className="font-normal text-slate-300 mx-1.5">|</span> {selectedAttendance.userNik || '-'}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest ${selectedAttendance.type === 'IN'
                    ? 'bg-emerald-100/60 text-emerald-700'
                    : 'bg-amber-100/60 text-amber-700'
                    }`}>
                    {selectedAttendance.type === 'IN' ? 'MASUK' : 'KELUAR'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-5 gap-x-4 pt-5 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                    <p className="text-[14px] font-bold text-slate-800">{formatDate(selectedAttendance.recordedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proyek/Lokasi</p>
                    <p className="text-[14px] font-bold text-slate-800">{selectedAttendance.projectName || 'Pusat / Tidak ada'}</p>
                  </div>
                  <div className="col-span-2 bg-white p-3.5 rounded-xl border border-slate-100 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direkam Oleh</p>
                    <p className="text-[13px] font-bold text-slate-700">
                      {selectedAttendance.recordedByName} <span className="font-medium text-slate-400">({selectedAttendance.recordedByRole})</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[180px] flex flex-col">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2.5 ml-1">
                  <MapPin size={14} className="text-slate-400" /> Kordinat GPS
                </p>
                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                  {selectedAttendance.latitude && selectedAttendance.longitude ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0, minHeight: '180px' }}
                      src={`https://maps.google.com/maps?q=${selectedAttendance.latitude},${selectedAttendance.longitude}&z=16&output=embed`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MapPin size={28} className="mb-2 opacity-40" />
                      <span className="font-bold text-xs">Lokasi GPS tidak tersedia</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceRecap;