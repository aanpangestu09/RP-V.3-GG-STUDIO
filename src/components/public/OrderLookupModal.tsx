import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Download, 
  ExternalLink, 
  Key, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatRupiah, formatDateTime } from '../../lib/formatters';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDownload: (token: string) => void;
}

export const OrderLookupModal: React.FC<OrderLookupModalProps> = ({
  isOpen,
  onClose,
  onGoToDownload
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccessId, setResendSuccessId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setResults(null);

    try {
      const res = await api.lookupOrders(query.trim());
      if (res.success && res.data) {
        setResults(res.data);
        if (res.data.length === 0) {
          setErrorMessage('Tidak ditemukan pesanan dengan nomor order atau email tersebut. Pastikan ejaan benar.');
        }
      } else {
        setErrorMessage(res.message || 'Gagal mencari pesanan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mencari pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const ok = await api.resendDelivery(orderId);
      if (ok) {
        setResendSuccessId(orderId);
        setTimeout(() => setResendSuccessId(null), 3000);
      }
    } catch (err) {
      alert('Gagal mengirim ulang.');
    } finally {
      setResendingId(null);
    }
  };

  const copyLicense = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Cek Pesanan & Akses Digital Mandiri
              </h3>
              <p className="text-xs text-slate-500">
                Lacak status transaksi, unduh ulang file, atau periksa kunci lisensi Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan No. Pesanan (ORD-...) atau Alamat Email Anda"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Cari</span>
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
            <span>Contoh pencarian:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('budi.santoso@archstudio.id');
              }}
              className="font-mono text-blue-600 hover:underline cursor-pointer"
            >
              budi.santoso@archstudio.id
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setQuery('ORD-20260928-000143');
              }}
              className="font-mono text-blue-600 hover:underline cursor-pointer"
            >
              ORD-20260928-000143
            </button>
          </div>
        </div>

        {/* Results container */}
        <div className="flex-1 overflow-y-auto p-6 pt-3 space-y-4">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Ditemukan {results.length} Pesanan:
              </span>

              {results.map((order) => {
                const isPaid = order.paymentStatus === 'PAID';
                const hasToken = !!order.downloadToken;

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-600 block">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-600">
                          {order.customerName} ({order.customerEmail})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentStatus === 'WAITING_PAYMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-800">• {item.productName}</span>
                          <span className="text-slate-500 font-mono">{formatRupiah(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* License key display if exists */}
                    {order.licenseKey && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wide">
                            Kunci Lisensi Software:
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                            {order.licenseKey}
                          </span>
                        </div>
                        <button
                          onClick={() => copyLicense(order.licenseKey)}
                          className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                        >
                          {copiedKey === order.licenseKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === order.licenseKey ? 'Tersalin' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {/* Quota details if available */}
                    {order.downloadQuota && (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                        <span>
                          Kuota Terpakai: <strong className="text-slate-800 font-mono">{order.downloadQuota.used} / {order.downloadQuota.limit}x</strong>
                        </span>
                        <span>
                          Kadaluarsa: <strong className="text-slate-800">{new Date(order.downloadQuota.expiresAt).toLocaleDateString('id-ID')}</strong>
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {isPaid && hasToken ? (
                        <button
                          onClick={() => {
                            onClose();
                            onGoToDownload(order.downloadToken);
                          }}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Akses Portal Unduhan</span>
                        </button>
                      ) : (
                        <div className="text-xs text-amber-700 italic">
                          Menunggu pelunasan pembayaran untuk mengaktifkan tautan unduhan.
                        </div>
                      )}

                      <button
                        onClick={() => handleResend(order.id)}
                        disabled={resendingId === order.id}
                        className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Kirim ulang link download dan faktur ke WhatsApp dan Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{resendSuccessId === order.id ? 'Terkirim!' : 'Kirim Ulang ke Email & WA'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Butuh bantuan langsung? Hubungi tim support WhatsApp kami di <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">+62 812-3456-7890</a>
        </div>
      </div>
    </div>
  );
};
