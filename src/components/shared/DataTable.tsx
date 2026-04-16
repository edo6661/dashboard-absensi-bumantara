/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileX2, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  expandedRowRender?: (row: any) => React.ReactNode;
  serverSide?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DataTable = ({
  title, columns, data, onAdd, onEdit, onDelete, expandedRowRender,
  serverSide = false, searchTerm = '', onSearchChange, page = 1, totalPages = 1, onPageChange
}: DataTableProps) => {

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (serverSide && onSearchChange) {
      const timeoutId = setTimeout(() => {
        if (localSearchTerm !== searchTerm) {
          onSearchChange(localSearchTerm);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localSearchTerm, serverSide, onSearchChange, searchTerm]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  };

  const filteredData = useMemo(() => {
    if (serverSide) return data;
    if (!localSearchTerm) return data;

    const lowercasedTerm = localSearchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.accessor];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, localSearchTerm, columns, serverSide]);

  const totalCols = columns.length + (expandedRowRender ? 1 : 0) + (onEdit || onDelete ? 1 : 0);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] border border-zinc-100 overflow-hidden flex flex-col transition-all duration-300">
      <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h2>
            {!serverSide && (
              <span className="px-2.5 py-1 bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-md border border-zinc-200/60">
                {filteredData.length} Data
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500 font-medium">Kelola dan pantau informasi operasional secara real-time.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 transition-colors" />
            <input
              type="text"
              placeholder="Cari data..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 focus:bg-white transition-all text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all duration-300 font-bold text-[12px] uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 text-zinc-500 text-[11px] uppercase font-bold tracking-widest border-b border-zinc-100">
              {expandedRowRender && <th className="px-4 py-4 w-10 text-center"></th>}
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-5 whitespace-nowrap font-bold">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-5 text-center whitespace-nowrap w-24">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/80">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => {
                const isExpanded = !!expandedRows[rowIndex];
                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      onClick={() => {
                        if (expandedRowRender) toggleRow(rowIndex);
                      }}
                      className={`transition-colors duration-200 group ${expandedRowRender ? 'cursor-pointer hover:bg-zinc-50' : 'hover:bg-zinc-50/50'} ${isExpanded ? 'bg-zinc-50' : ''}`}
                    >
                      {expandedRowRender && (
                        <td className="px-4 py-4 text-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                      )}
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 text-zinc-600 whitespace-nowrap font-medium">
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                            {onEdit && (
                              <button onClick={() => onEdit(row)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer">
                                <Edit2 size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => onDelete(row)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && expandedRowRender && (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={totalCols} className="px-6 py-6 border-b border-zinc-100">
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {expandedRowRender(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={totalCols} className="px-6 py-28 text-center">
                  <div className="flex flex-col items-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-5 ring-8 ring-zinc-50/50">
                      <FileX2 size={28} className="text-zinc-400" />
                    </div>
                    <h3 className="text-zinc-900 font-bold mb-1">Data tidak ditemukan</h3>
                    <p className="text-zinc-500 text-[13px] font-medium leading-relaxed">
                      Kami tidak dapat menemukan data yang Anda cari. Coba sesuaikan filter atau kata kunci pencarian Anda.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {serverSide && totalPages > 1 && (
        <div className="p-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((num, idx) => (
              num === "..." ? (
                <span key={idx} className="px-2 text-zinc-400 font-bold">...</span>
              ) : (
                <button
                  key={idx}
                  onClick={() => onPageChange?.(num as number)}
                  className={`min-w-[36px] h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all cursor-pointer ${page === num
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  {num}
                </button>
              )
            ))}

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;