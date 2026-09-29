import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  RefreshCw, 
  User, 
  Activity, 
  Lock 
} from 'lucide-react';
import { AuditLog } from '../../types/schema';
import { formatDateTime } from '../../lib/formatters';
import { api } from '../../lib/api';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => 
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jejak rekaman aktivitas admin, perubahan harga, modifikasi file, dan refund.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas, admin, atau detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Pelaksana (Actor)</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Tindakan (Action)</th>
                <th className="py-3 px-6">Rincian Perubahan</th>
                <th className="py-3 px-6">IP Address</th>
                <th className="py-3 px-6">Waktu Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    {log.userName}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-6 text-slate-700 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
