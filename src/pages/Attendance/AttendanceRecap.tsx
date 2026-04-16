import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight, MapPin, Maximize2, UserCircle2 } from 'lucide-react';

import { useAttendanceHistory } from '../../hooks/useAttendance';
import api from '../../lib/axios';
import DataTable from '../../components/shared/DataTable';
import Select from '../../components/shared/Select';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import { formatDate } from '../../utils/formatters';
import type { Attendance, AttendanceHistoryParams } from '../../types/models/attendance';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const AttendanceRecap = () => {
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles')).data.data });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: async () => (await api.get('/projects')).data.data });
  const { data: companies } = useQuery({ queryKey: ['perusahaan'], queryFn: async () => (await api.get('/perusahaan')).data.data });

  const [filters, setFilters] = useState<AttendanceHistoryParams>({
    limit: 10, search: '', type: '', sortOrder: 'desc',
    startDate: getTodayDateString(), endDate: getTodayDateString(),
    role: '', projectId: '', perusahaanId: '',
  });

  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data } = useAttendanceHistory({ ...filters, cursor: currentCursor });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleNextPage = () => {
    if (data?.meta.nextCursor) {
      setCursorHistory(prev => [...prev, currentCursor || '']);
      setCurrentCursor(data.meta.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCurrentCursor(prevCursor === '' ? undefined : prevCursor);
    }
  };

  const handleExportExcel = () => {
    if (!data?.items.length) return;
    const headers = ['Nama', 'NIK', 'Tipe', 'Waktu', 'Proyek', 'Lokasi'];
    const rows = data.items.map(item => [
      `"${item.userName}"`, `"${item.userNik || '-'}"`, `"${item.type}"`,
      `"${formatDate(item.recordedAt)}"`, `"${item.projectName || '-'}"`,
      `"${item.latitude},${item.longitude}"`
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Absensi_${filters.startDate}.csv`;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExportingPDF(true);
    try {
      const dataUrl = await toPng(tableRef.current, { backgroundColor: '#fff', pixelRatio: 2 });
      const pdf = new jsPDF('l', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const printHeight = (imgProps.height * (width - 20)) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 10, 10, width - 20, printHeight);
      pdf.save(`Absensi_${filters.startDate}.pdf`);
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
          className="relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer group border border-zinc-200/80 shadow-sm"
          onClick={() => setSelectedAttendance(row)}
        >
          {val ? (
            <img src={val} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview" />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
              <UserCircle2 className="text-zinc-300" size={24} />
            </div>
          )}
          <div className="absolute inset-0 bg-zinc-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[1px]">
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
          <p className="font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">{val}</p>
          <p className="text-[12px] text-zinc-500 font-medium mt-0.5">{row.userRole} <span className="mx-1 text-zinc-300">•</span> {row.userNik || 'No NIK'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'type',
      render: (val: string) => (
        <span className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border tracking-wide ${val === 'IN'
          ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200/60'
          : 'bg-amber-50/50 text-amber-600 border-amber-200/60'
          }`}>
          {val === 'IN' ? 'MASUK' : 'KELUAR'}
        </span>
      )
    },
    {
      header: 'Waktu',
      accessor: 'recordedAt',
      render: (val: string) => <span className="text-[13px] font-semibold text-zinc-700">{formatDate(val)}</span>
    },
    {
      header: 'Proyek',
      accessor: 'projectName',
      render: (val: string) => <span className="text-[13px] font-medium text-zinc-500">{val || '-'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Rekap Absensi</h1>
          <p className="text-zinc-500 text-[14px] font-medium mt-1">Sistem pemantauan kehadiran & integrasi biometrik.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl font-bold text-[13px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm cursor-pointer active:scale-95">
            <FileSpreadsheet size={18} className="text-emerald-600" /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-[13px] hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/10 transition-all active:scale-95 cursor-pointer">
            {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} PDF
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] border border-zinc-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-5 gap-y-2">
          <Input label="Mulai" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          <Input label="Selesai" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          <Select label="Tipe" name="type" value={filters.type} onChange={handleFilterChange} options={[{ value: '', label: 'Semua Tipe' }, { value: 'IN', label: 'Masuk' }, { value: 'OUT', label: 'Keluar' }]} />
          <Select label="Perusahaan" name="perusahaanId" value={filters.perusahaanId} onChange={handleFilterChange} options={[{ value: '', label: 'Semua Perusahaan' }, ...(companies?.map((c: any) => ({ value: c.id, label: c.nama })) || [])]} />
          <Select label="Proyek" name="projectId" value={filters.projectId} onChange={handleFilterChange} options={[{ value: '', label: 'Semua Proyek' }, ...(projects?.map((p: any) => ({ value: p.id, label: p.name })) || [])]} />
          <Select label="Jabatan" name="role" value={filters.role} onChange={handleFilterChange} options={[{ value: '', label: 'Semua Jabatan' }, ...(roles?.map((r: any) => ({ value: r.name, label: r.name })) || [])]} />
        </div>
      </div>

      {/* Table Area */}
      <div ref={tableRef}>
        <DataTable
          title="Log Kehadiran"
          columns={columns}
          data={data?.items || []}
          serverSide
          searchTerm={filters.search}
          onSearchChange={(s) => setFilters(f => ({ ...f, search: s }))}
        />

        {/* Manual Pagination Info */}
        <div className="mt-4 flex justify-between items-center px-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Total Record: {data?.items.length || 0}</span>
          <div className="flex gap-2">
            <button onClick={handlePrevPage} disabled={cursorHistory.length === 0} className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 disabled:opacity-30 cursor-pointer hover:bg-zinc-50 hover:text-zinc-900 transition-colors"><ChevronLeft size={18} strokeWidth={2.5} /></button>
            <button onClick={handleNextPage} disabled={!data?.meta.hasNextPage} className="p-2.5 rounded-xl bg-zinc-900 text-white disabled:opacity-30 cursor-pointer hover:bg-zinc-800 transition-colors shadow-md shadow-zinc-900/10"><ChevronRight size={18} strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>

      {/* Modal Detail Absensi */}
      <Modal isOpen={!!selectedAttendance} onClose={() => setSelectedAttendance(null)} title="Detail Validasi Kehadiran">
        {selectedAttendance && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto Biometrik */}
            <div className="w-full md:w-2/5">
              <div className="rounded-3xl overflow-hidden border-[8px] border-white shadow-xl shadow-zinc-200/50 aspect-[3/4] bg-zinc-100 relative group">
                {selectedAttendance.capturedImageUrl ? (
                  <img src={selectedAttendance.capturedImageUrl} className="w-full h-full object-cover" alt="Captured Biometric" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col text-zinc-400 gap-3">
                    <UserCircle2 size={64} strokeWidth={1} />
                    <span className="text-sm font-medium">Foto tidak tersedia</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white shadow-sm flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confidence Score</span>
                  <span className="text-sm font-black text-zinc-900">{selectedAttendance.confidence ? `${(selectedAttendance.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Info & Map */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white p-7 rounded-3xl border border-zinc-100 shadow-sm shadow-zinc-100/50">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{selectedAttendance.userName}</h2>
                    <p className="font-bold text-zinc-500 mt-1">{selectedAttendance.userRole} <span className="font-normal text-zinc-300 mx-1.5">|</span> {selectedAttendance.userNik || '-'}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest border ${selectedAttendance.type === 'IN'
                    ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/60'
                    : 'bg-amber-50/80 text-amber-600 border-amber-200/60'
                    }`}>
                    {selectedAttendance.type === 'IN' ? 'MASUK' : 'KELUAR'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-zinc-100">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Waktu Pencatatan</p>
                    <p className="text-[14px] font-bold text-zinc-900">{formatDate(selectedAttendance.recordedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Proyek / Lokasi</p>
                    <p className="text-[14px] font-bold text-zinc-900">{selectedAttendance.projectName || 'Pusat / Tidak ada'}</p>
                  </div>
                  <div className="col-span-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mt-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Direkam Oleh</p>
                    <p className="text-[13px] font-bold text-zinc-700">
                      {selectedAttendance.recordedByName} <span className="font-medium text-zinc-500">({selectedAttendance.recordedByRole})</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="flex-1 min-h-[220px] flex flex-col">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-3 ml-1">
                  <MapPin size={14} className="text-zinc-400" /> Kordinat GPS
                </p>
                <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-200 shadow-inner bg-zinc-100 relative">
                  {selectedAttendance.latitude && googleMapsKey ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0, minHeight: '220px' }}
                      src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${selectedAttendance.latitude},${selectedAttendance.longitude}&zoom=16`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
                      <MapPin size={32} className="mb-3 opacity-40" />
                      <span className="font-bold text-sm">Lokasi GPS tidak tersedia</span>
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