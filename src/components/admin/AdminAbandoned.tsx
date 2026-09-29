import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Send, 
  Search, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AbandonedCheckout } from '../../types/schema';
import { formatRupiah, formatDateTime } from '../../lib/formatters';
import { api } from '../../lib/api';

export const AdminAbandoned: React.FC = () => {
  const [abandonedList, setAbandonedList] = useState<AbandonedCheckout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAbandoned = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAbandoned();
      setAbandonedList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbandoned();
  }, []);

  const handleSendReminder = async (id: string) => {
    setSendingId(id);
    setSuccessMsg('');
    try {
      const ok = await api.recoverAbandoned(id);
      if (ok) {
        setSuccessMsg('✅ Pesan WhatsApp & Email pemulihan keranjang berhasil dikirimkan!');
        fetchAbandoned();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Abandoned
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow-up calon pembeli yang belum menyelesaikan pembayaran.
          </p>
        </div>

        <button
          onClick={fetchAbandoned}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="font-extrabold text-sm sm:text-base">Siklus Otomatisasi Reminder WhatsApp (Fonnte/Waha)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs text-slate-200">
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="font-bold text-amber-300 block mb-1">⏱️ Menit ke-2:</span>
            <span>"Pesanan Anda masih menunggu pembayaran di Ruang Proyek."</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="font-bold text-amber-300 block mb-1">⏱️ Menit ke-30:</span>
            <span>"Jangan sampai diskon produk arsitektur Anda hangus hari ini."</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="font-bold text-amber-300 block mb-1">⏱️ Jam ke-24:</span>
            <span>"Penawaran terakhir: Link checkout Anda masih kami simpan."</span>
          </div>
        </div>
      </div>

      {/* Abandoned table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Calon Customer</th>
                <th className="py-3 px-6">Kontak</th>
                <th className="py-3 px-6">Produk Tertinggal</th>
                <th className="py-3 px-6">Nominal</th>
                <th className="py-3 px-6">Reminder Terkirim</th>
                <th className="py-3 px-6">Waktu Dibuat</th>
                <th className="py-3 px-6 text-right">Aksi Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {abandonedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada abandoned checkout yang belum dipulihkan.
                  </td>
                </tr>
              ) : (
                abandonedList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {item.customerName}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="block font-medium text-slate-800">{item.customerPhone}</span>
                      <span className="block text-[11px] text-slate-400">{item.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-3.5 px-6 font-black text-slate-900">
                      {formatRupiah(item.totalAmount)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {item.remindersSent}x Terkirim
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleSendReminder(item.id)}
                        disabled={sendingId === item.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Reminder WA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
