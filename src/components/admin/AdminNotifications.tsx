import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { NotificationLog } from '../../types/schema';
import { formatDateTime } from '../../lib/formatters';
import { api } from '../../lib/api';
import { useStoreSettings } from '../../context/StoreContext';

export const AdminNotifications: React.FC = () => {
  const { storeProfile } = useStoreSettings();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'EMAIL' | 'WHATSAPP' | 'TELEGRAM'>('ALL');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotificationLogs();
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

  const filtered = logs.filter(l => channelFilter === 'ALL' || l.channel === channelFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notifikasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat pengiriman email, WhatsApp, dan notifikasi pesanan.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'EMAIL', 'WHATSAPP', 'TELEGRAM'] as const).map(ch => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              channelFilter === ch
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {ch === 'ALL' ? 'Semua Channel' : ch}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Penerima</th>
                <th className="py-3 px-6">Subjek / Judul</th>
                <th className="py-3 px-6">Status Pengiriman</th>
                <th className="py-3 px-6">Waktu Dikirim</th>
                <th className="py-3 px-6 text-right">Lihat Pesan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada log notifikasi yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        log.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' :
                        log.channel === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {log.channel === 'WHATSAPP' && <Phone className="w-3 h-3" />}
                        {log.channel === 'EMAIL' && <Mail className="w-3 h-3" />}
                        {log.channel === 'TELEGRAM' && <MessageSquare className="w-3 h-3" />}
                        <span>{log.channel}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {log.recipient}
                    </td>
                    <td className="py-3.5 px-6 text-slate-800 max-w-xs truncate">
                      {log.subjectOrTitle}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Terkirim
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono">
                      {formatDateTime(log.sentAt)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
                      >
                        Pratinjau
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Content Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Isi Pesan ({selectedLog.channel})
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedLog.channel === 'EMAIL' && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={storeProfile.logoUrl}
                      alt={storeProfile.businessName}
                      className="w-8 h-8 rounded-lg object-cover bg-white/10 p-0.5 border border-white/20 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
                      }}
                    />
                    <div>
                      <span className="font-extrabold text-xs block text-white uppercase tracking-tight">
                        {storeProfile.businessName}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold block">
                        Header Email Resmi Pengiriman
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                    Email Header
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Penerima:</span>
                <span className="text-xs font-semibold text-slate-900">{selectedLog.recipient}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Subjek:</span>
                <span className="text-xs font-bold text-slate-900">{selectedLog.subjectOrTitle}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Body Template:</span>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {selectedLog.messageBody}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
