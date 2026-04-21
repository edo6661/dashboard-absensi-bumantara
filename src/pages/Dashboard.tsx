import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, MapPin, Loader2, ArrowRight,
  Briefcase, Clock, ArrowRightLeft, CalendarDays
} from 'lucide-react';
import { attendanceService } from '../services/attendance.service';
import type { Attendance } from '../types/models/attendance';
import { formatDate } from '../utils/formatters';
type TimeRange = 'today' | '7d' | '30d' | '3m' | '1y' | 'all';
const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const dateParams = useMemo(() => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = endDate;
    if (timeRange === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (timeRange === '30d') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
    } else if (timeRange === '3m') {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      startDate = d.toISOString().split('T')[0];
    } else if (timeRange === '1y') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
    } else if (timeRange === 'all') {
      startDate = '2000-01-01';
    }
    return { startDate, endDate };
  }, [timeRange]);
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['dashboard-attendance', dateParams],
    queryFn: async () => {
      const res = await attendanceService.getHistory({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        limit: 1000,
        sortOrder: 'desc'
      });
      return res.items;
    }
  });
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
  const filterOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7d', label: '7 Hari' },
    { value: '30d', label: '30 Hari' },
    { value: '3m', label: '3 Bulan' },
    { value: '1y', label: '1 Tahun' },
    { value: 'all', label: 'Semua' },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Ikhtisar Operasional</h1>
          <p className="text-white text-[13px] sm:text-[14px] font-medium mt-1">Status kehadiran dan aktivitas real-time.</p>
        </div>

        {/* Filter dibuat horizontal scrollable di mobile agar tidak memakan ruang tinggi */}
        <div className="w-full xl:w-auto overflow-x-auto custom-scrollbar pb-2 xl:pb-0 -mx-4 px-4 xl:mx-0 xl:px-0">
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 w-max shadow-sm">
            <div className="flex items-center gap-2 px-3 text-slate-400 border-r border-slate-100 hidden sm:flex">
              <CalendarDays size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Rentang</span>
            </div>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${timeRange === opt.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 gap-3 bg-white/50 dark:bg-slate-800/20 rounded-[20px] border border-dashed border-slate-200 dark:border-slate-700">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <span className="font-medium text-sm">Mengkalkulasi data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Kehadiran</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{uniqueUsersPresent} <span className="text-sm font-medium text-slate-500 tracking-normal">Orang</span></h2>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                <Building2 size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi Terpantau</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{projectSummaryArray.length} <span className="text-sm font-medium text-slate-500 tracking-normal">Proyek</span></h2>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                <ArrowRightLeft size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Absen Keluar</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{totalOut} <span className="text-sm font-medium text-slate-500 tracking-normal">Data</span></h2>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800/80 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                  <MapPin size={18} className="text-indigo-600" />
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Distribusi per Proyek</h3>
                </div>
                <div className="p-6">
                  {projectSummaryArray.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projectSummaryArray.map((project, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                          <h4 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{project.name}</h4>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{project.count}</span>
                            <span className="text-[11px] font-bold text-slate-400 ml-1.5 uppercase tracking-wider">Orang</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm font-medium">Data proyek tidak ditemukan.</div>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                  <Briefcase size={18} className="text-indigo-600" />
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Berdasarkan Jabatan</h3>
                </div>
                <div className="p-6">
                  {roleSummaryArray.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {roleSummaryArray.map((role, idx) => (
                        <div key={idx} className="flex-1 min-w-[140px] p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{role.count}</span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{role.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm font-medium">Data jabatan tidak ditemukan.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/80 rounded-[20px] shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                <Clock size={18} className="text-indigo-600" />
                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Log Terakhir</h3>
              </div>
              <div className="p-6 flex-1">
                {recentActivities.length > 0 ? (
                  <div className="space-y-6">
                    {recentActivities.map((act, idx) => (
                      <div key={idx} className="relative pl-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700 last:before:hidden">
                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 shadow-sm ${act.type === 'IN' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{act.userName}</p>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {act.type === 'IN' ? 'Masuk di ' : 'Keluar dari '}
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{act.projectName || 'Pusat'}</span>
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">{formatDate(act.recordedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[200px]">
                    <Clock size={32} className="text-slate-200 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-medium">Log aktivitas kosong.</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <a href="/attendance/recap" className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  Selengkapnya <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;