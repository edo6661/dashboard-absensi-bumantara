import { useQuery } from '@tanstack/react-query';
import { Users, Building2, MapPin, Loader2, ArrowRight, Briefcase, Clock, ArrowRightLeft } from 'lucide-react';
import type { Attendance } from '../types/models/attendance'; import { formatDate } from '../utils/formatters';
import { attendanceService } from '../services/attendance.service';
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const Dashboard = () => {
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['dashboard-attendance', getTodayDateString()],
    queryFn: async () => {
      const today = getTodayDateString();
      const res = await attendanceService.getHistory({
        startDate: today,
        endDate: today,
        limit: 1000,
        sortOrder: 'desc'
      });
      return res.items;
    }
  });
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-3">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
        <span className="font-medium text-sm">Memuat ringkasan operasional...</span>
      </div>
    );
  }
  const allAttendances = attendanceData || [];
  const attendancesIn = allAttendances.filter(a => a.type === 'IN');
  const uniqueUsersPresent = new Set(attendancesIn.map(a => a.userNik || a.userName)).size;
  const totalOut = allAttendances.filter(a => a.type === 'OUT').length;
  const projectSummary = attendancesIn.reduce((acc: Record<string, number>, curr: Attendance) => {
    const projectName = curr.projectName || 'Pusat / Tanpa Proyek';
    if (!acc[projectName]) acc[projectName] = 0;
    acc[projectName]++;
    return acc;
  }, {});
  const projectSummaryArray = Object.entries(projectSummary)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const roleSummary = attendancesIn.reduce((acc: Record<string, number>, curr: Attendance) => {
    const roleName = curr.userRole || 'Tidak Diketahui';
    if (!acc[roleName]) acc[roleName] = 0;
    acc[roleName]++;
    return acc;
  }, {});
  const roleSummaryArray = Object.entries(roleSummary)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const recentActivities = allAttendances.slice(0, 5);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Ikhtisar Operasional</h1>
        <p className="text-slate-500 dark:text-slate-400 text-[14px] font-medium mt-1">Status kehadiran dan aktivitas real-time hari ini.</p>
      </div>
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Total Hadir */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hadir (Masuk)</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{uniqueUsersPresent} <span className="text-sm font-medium text-slate-500 tracking-normal">Orang</span></h2>
          </div>
        </div>
        {/* Card: Total Proyek */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proyek Aktif</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{projectSummaryArray.length} <span className="text-sm font-medium text-slate-500 tracking-normal">Lokasi</span></h2>
          </div>
        </div>
        {/* Card: Pulang */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowRightLeft size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Selesai (Keluar)</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{totalOut} <span className="text-sm font-medium text-slate-500 tracking-normal">Absen</span></h2>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Distribusi Proyek & Jabatan (Makan 2 Kolom di LG) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Breakdown per Proyek */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <MapPin size={18} className="text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Distribusi Pekerja per Lokasi</h3>
            </div>
            <div className="p-6">
              {projectSummaryArray.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectSummaryArray.map((project, idx) => (
                    <div key={idx} className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300">
                      <h4 className="text-[14px] font-bold text-slate-700 group-hover:text-indigo-700 transition-colors line-clamp-1">{project.name}</h4>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-black text-slate-800 tracking-tight">{project.count}</span>
                          <span className="text-[11px] font-bold text-slate-400 ml-1.5 uppercase tracking-wider">Orang</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">Belum ada data absensi proyek hari ini.</div>
              )}
            </div>
          </div>
          {/* Breakdown per Jabatan */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <Briefcase size={18} className="text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Kehadiran Berdasarkan Jabatan</h3>
            </div>
            <div className="p-6">
              {roleSummaryArray.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {roleSummaryArray.map((role, idx) => (
                    <div key={idx} className="flex-1 min-w-[140px] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-800">{role.count}</span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{role.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">Belum ada data jabatan hari ini.</div>
              )}
            </div>
          </div>
        </div>
        {/* Kolom Kanan: Aktivitas Terkini (Makan 1 Kolom di LG) */}
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Aktivitas Terkini</h3>
            </div>
          </div>
          <div className="p-6 flex-1">
            {recentActivities.length > 0 ? (
              <div className="space-y-6">
                {recentActivities.map((act, idx) => (
                  <div key={idx} className="relative pl-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 last:before:hidden">
                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${act.type === 'IN' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{act.userName}</p>
                      <p className="text-[12px] text-slate-500 font-medium mt-1">
                        {act.type === 'IN' ? 'Masuk di ' : 'Keluar dari '}
                        <span className="text-slate-700 font-semibold">{act.projectName || 'Pusat'}</span>
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{formatDate(act.recordedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[200px]">
                <Clock size={32} className="text-slate-200 mb-3" />
                <p className="text-sm font-medium">Belum ada aktivitas terekam.</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <a href="/attendance/recap" className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-700 transition-colors">
              Lihat Semua Log <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Dashboard;