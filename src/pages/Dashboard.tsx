/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, MapPin, Loader2, ArrowRight,
  Briefcase, Clock, ArrowRightLeft, CalendarDays, PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

import { attendanceService } from '../services/attendance.service';
import { userService } from '../services/user.service';
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


  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['dashboard-attendance', dateParams],
    queryFn: async () => {
      const res = await attendanceService.getHistory({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        limit: 10000,
        sortOrder: 'desc'
      });
      return res.items;
    }
  });


  const { data: allUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['dashboard-all-users'],
    queryFn: async () => {
      const res = await userService.getUsers({ limit: 10000 });
      return res.items;
    }
  });

  const isLoading = isLoadingAttendance || isLoadingUsers;
  const allAttendances = attendanceData || [];
  const attendancesIn = allAttendances.filter(a => a.type === 'IN');


  const uniqueUsersPresent = new Set(attendancesIn.map(a => a.userNik || a.userName)).size;
  const totalOut = allAttendances.filter(a => a.type === 'OUT').length;


  const projectSummary = attendancesIn.reduce((acc: Record<string, Set<string>>, curr: Attendance) => {
    const projectName = curr.projectName || 'Pusat / Tanpa Proyek';
    const userIdentifier = curr.userNik || curr.userName;
    if (!acc[projectName]) acc[projectName] = new Set();
    acc[projectName].add(userIdentifier);
    return acc;
  }, {});

  const projectSummaryArray = Object.entries(projectSummary)
    .map(([name, uniqueUsersSet]) => ({ name, count: uniqueUsersSet.size }))
    .sort((a, b) => b.count - a.count);


  const roleSummary = attendancesIn.reduce((acc: Record<string, Set<string>>, curr: Attendance) => {
    const roleName = curr.userRole || 'Tidak Diketahui';
    const userIdentifier = curr.userNik || curr.userName;
    if (!acc[roleName]) acc[roleName] = new Set();
    acc[roleName].add(userIdentifier);
    return acc;
  }, {});

  const roleSummaryArray = Object.entries(roleSummary)
    .map(([name, uniqueUsersSet]) => ({ name, count: uniqueUsersSet.size }))
    .sort((a, b) => b.count - a.count);


  const chartData = useMemo(() => {
    if (!allUsersData) return [];


    const baselineCompany = allUsersData.reduce((acc: Record<string, number>, user) => {
      const company = user.perusahaanNama || 'Pusat / Internal';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});



    const inRecords = (attendanceData || []).filter(a => a.type === 'IN');

    const attendingCompany = inRecords.reduce((acc: Record<string, Set<string>>, curr) => {
      const company = curr.userPerusahaanNama || 'Pusat / Internal';
      const userIdentifier = curr.userNik || curr.userName;
      if (!acc[company]) acc[company] = new Set();
      acc[company].add(userIdentifier);
      return acc;
    }, {});


    return Object.keys(baselineCompany).map(company => {
      const totalKaryawan = baselineCompany[company] || 0;
      const totalHadir = attendingCompany[company]?.size || 0;
      const percentage = totalKaryawan > 0 ? Math.round((totalHadir / totalKaryawan) * 100) : 0;

      return {
        name: company,
        PersentaseHadir: percentage,
        PersentaseAbsen: 100 - percentage,
        totalHadir,
        totalKaryawan
      };
    }).sort((a, b) => b.PersentaseHadir - a.PersentaseHadir);
  }, [allUsersData, attendanceData]);
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
      {/* ... [Header dan Filter Rentang Waktu tetap sama seperti sebelumnya] ... */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Ikhtisar Operasional</h1>
          <p className="text-slate-500 text-[13px] sm:text-[14px] font-medium mt-1">Status kehadiran dan aktivitas real-time.</p>
        </div>
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
        <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 gap-3 bg-white/50 rounded-[20px] border border-dashed border-slate-200">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <span className="font-medium text-sm">Mengkalkulasi data analitik...</span>
        </div>
      ) : (
        <>
          {/* ... [Grid 3 Kotak Data Tetap Sama, Hanya Data Saja Yang Berubah Berdasarkan Logic Baru] ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Karyawan Hadir</p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{uniqueUsersPresent} <span className="text-sm font-medium text-slate-500 tracking-normal">Orang Unik</span></h2>
              </div>
            </div>
            {/* ... Kotak lainnya (Lokasi Terpantau & Total Absen Keluar) */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <Building2 size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi Terpantau</p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{projectSummaryArray.length} <span className="text-sm font-medium text-slate-500 tracking-normal">Proyek</span></h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <ArrowRightLeft size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Absen Keluar</p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{totalOut} <span className="text-sm font-medium text-slate-500 tracking-normal">Data Log</span></h2>
              </div>
            </div>
          </div>

          {/* BAGIAN BARU: CHART TINGKAT KEHADIRAN PERUSAHAAN */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <PieChartIcon size={18} className="text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Tingkat Kehadiran Karyawan per Perusahaan (%)</h3>
            </div>
            <div className="p-6 h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                    <Bar dataKey="PersentaseHadir" radius={[0, 6, 6, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.PersentaseHadir >= 80 ? '#10b981' : entry.PersentaseHadir >= 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data absensi untuk ditampilkan.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* DISTRIBUSI PROYEK (Sekarang Menampilkan Orang Unik) */}
              <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <MapPin size={18} className="text-indigo-600" />
                  <h3 className="text-[15px] font-bold text-slate-800">Distribusi Karyawan per Proyek</h3>
                </div>
                <div className="p-6">
                  {projectSummaryArray.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projectSummaryArray.map((project, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                          <h4 className="text-[14px] font-bold text-slate-700">{project.name}</h4>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-slate-800">{project.count}</span>
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

              {/* DISTRIBUSI JABATAN (Sekarang Menampilkan Orang Unik) */}
              <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <Briefcase size={18} className="text-indigo-600" />
                  <h3 className="text-[15px] font-bold text-slate-800">Berdasarkan Jabatan</h3>
                </div>
                <div className="p-6">
                  {roleSummaryArray.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {roleSummaryArray.map((role, idx) => (
                        <div key={idx} className="flex-1 min-w-[140px] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-800">{role.count}</span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">{role.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm font-medium">Data jabatan tidak ditemukan.</div>
                  )}
                </div>
              </div>

            </div>

            {/* LOG TERAKHIR (Dengan Jam & Menit yang sudah diperbaiki di formatters) */}
            <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <Clock size={18} className="text-indigo-600" />
                <h3 className="text-[15px] font-bold text-slate-800">Log Terakhir</h3>
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
                          {/* formatDate di bawah ini sekarang akan memunculkan Jam dan Menit */}
                          <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{formatDate(act.recordedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[200px]">
                    <Clock size={32} className="text-slate-200 mb-3" />
                    <p className="text-sm font-medium">Log aktivitas kosong.</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <a href="/attendance/recap" className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2">
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-600 font-semibold">
            Tingkat Kehadiran: {data.PersentaseHadir}%
          </p>
          <p className="text-slate-500 font-medium text-[13px]">
            {data.totalHadir} hadir dari total {data.totalKaryawan} karyawan
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default Dashboard;