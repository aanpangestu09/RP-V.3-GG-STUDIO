import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Mail, 
  Phone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Download, 
  Key, 
  ExternalLink,
  MessageSquare,
  FileText,
  DollarSign,
  X,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/schema';
import { formatRupiah, formatDateTime, formatTime } from '../../lib/formatters';
import { api } from '../../lib/api';

interface AdminOrdersProps {
  initialSelectedOrderId?: string;
  onViewProduct?: (slug: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ initialSelectedOrderId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');

  // Download protection states
  const [downloadDetails, setDownloadDetails] = useState<any | null>(null);
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchDownloadData = async (token: string) => {
    try {
      const res = await api.validateDownloadToken(token);
      if (res.success && res.data) {
        setDownloadDetails(res.data);
      }
      const logsRes = await api.getDownloadLogs(token);
      if (logsRes.success) {
        setDownloadLogs(logsRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const metrics = await api.getAdminMetrics();
      if (metrics?.recentOrders) {
        setOrders(metrics.recentOrders);
        if (initialSelectedOrderId) {
          const target = metrics.recentOrders.find((o: Order) => o.id === initialSelectedOrderId);
          if (target) {
            setSelectedOrder(target);
            setInternalNoteText(target.internalNotes || '');
            if (target.downloadToken) fetchDownloadData(target.downloadToken);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [initialSelectedOrderId]);

  // Handle open order detail
  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setInternalNoteText(order.internalNotes || '');
    setActionMessage('');
    setDownloadDetails(null);
    setDownloadLogs([]);
    setShowLogs(false);
    if (order.downloadToken) {
      fetchDownloadData(order.downloadToken);
    }
  };

  // Reset Download Quota
  const handleResetQuota = async () => {
    if (!selectedOrder?.downloadToken) return;
    setActionLoading(true);
    try {
      const res = await api.resetDownloadQuota(selectedOrder.downloadToken);
      if (res.success) {
        setActionMessage('✅ Kuota unduhan berhasil di-reset menjadi 0!');
        fetchDownloadData(selectedOrder.downloadToken);
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Revoke
  const handleToggleRevoke = async () => {
    if (!selectedOrder?.downloadToken) return;
    setActionLoading(true);
    try {
      const res = await api.toggleDownloadRevoke(selectedOrder.downloadToken);
      if (res.success) {
        setActionMessage(`✅ ${res.message}`);
        fetchDownloadData(selectedOrder.downloadToken);
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Extend Expiry
  const handleExtendExpiry = async () => {
    if (!selectedOrder?.downloadToken) return;
    setActionLoading(true);
    try {
      const res = await api.extendDownloadExpiry(selectedOrder.downloadToken, 30);
      if (res.success) {
        setActionMessage(`✅ ${res.message}`);
        fetchDownloadData(selectedOrder.downloadToken);
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset License
  const handleResetLicense = async () => {
    if (!selectedOrder?.licenseKey) return;
    setActionLoading(true);
    try {
      const res = await api.resetLicense(selectedOrder.licenseKey);
      if (res.success) {
        setActionMessage('✅ Seluruh aktivasi perangkat untuk license key ini berhasil di-reset.');
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Resend Product & Notifications
  const handleResendDelivery = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      const ok = await api.resendDelivery(selectedOrder.id);
      if (ok) {
        setActionMessage('✅ Tautan unduhan aman, notifikasi Email, dan WhatsApp berhasil dikirim ulang ke customer!');
        // Refresh detail
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Process Refund
  const handleRefund = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Konfirmasi pengembalian dana (refund) untuk pesanan ${selectedOrder.orderNumber}? Tautan unduhan akan langsung dicabut.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const ok = await api.refundOrder(selectedOrder.id);
      if (ok) {
        setActionMessage('✅ Pesanan berhasil direfund dan token akses download telah dinonaktifkan.');
        const updated = await api.getOrder(selectedOrder.id);
        if (updated) setSelectedOrder(updated);
        fetchOrders();
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Internal Note
  const handleSaveNote = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const ok = await api.updateOrderNotes(selectedOrder.id, internalNoteText);
      if (ok) {
        setActionMessage('✅ Catatan internal pesanan berhasil disimpan.');
      }
    } catch (err: any) {
      setActionMessage(`❌ Gagal: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.paymentStatus === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.items.some(item => item.productName.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Order
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar transaksi masuk, status pembayaran, dan link akses digital.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari order #, nama, email, WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'PAID', label: 'PAID (Lunas)' },
            { id: 'WAITING_PAYMENT', label: 'Menunggu Bayar' },
            { id: 'REFUNDED', label: 'Refund' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Produk & Item</th>
                <th className="py-3 px-6">Total Tagihan</th>
                <th className="py-3 px-6">Metode</th>
                <th className="py-3 px-6">Status Bayar</th>
                <th className="py-3 px-6">Status Delivery</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada pesanan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {formatDateTime(ord.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-500 block">{ord.customerEmail}</span>
                      <span className="text-[10px] text-slate-400 block">{ord.customerPhone}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-slate-800 line-clamp-1">
                        {ord.items[0]?.productName}
                      </span>
                      {ord.items.length > 1 && (
                        <span className="text-[10px] text-blue-600 font-bold">
                          +{ord.items.length - 1} item tambahan (Order Bump/Upsell)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {formatRupiah(ord.totalAmount)}
                    </td>
                    <td className="py-3.5 px-6 font-medium">
                      {ord.paymentMethod}
                    </td>
                    <td className="py-3.5 px-6">
                      {ord.paymentStatus === 'PAID' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      ) : ord.paymentStatus === 'WAITING_PAYMENT' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                          WAITING
                        </span>
                      ) : ord.paymentStatus === 'REFUNDED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                          REFUNDED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                          {ord.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {ord.deliveryStatus === 'DELIVERED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terkirim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(ord)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-all"
                      >
                        Detail & Timeline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ORDER DETAIL & TIMELINE MODAL / DRAWER                   */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  DETAIL PESANAN RESMI
                </span>
                <h3 className="text-xl font-black text-slate-900 font-mono">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionMessage && (
              <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold">
                {actionMessage}
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="mt-6 flex flex-wrap gap-2.5 pb-6 border-b border-slate-100">
              <button
                onClick={handleResendDelivery}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Ulang Produk (Email & WA)</span>
              </button>

              {selectedOrder.downloadToken && (
                <a
                  href={`/download/${selectedOrder.downloadToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Buka Link Download Customer</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}

              {selectedOrder.paymentStatus === 'PAID' && (
                <button
                  onClick={handleRefund}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refund Pesanan</span>
                </button>
              )}
            </div>

            {/* Customer & Payment Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Informasi Customer
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedOrder.customerEmail}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedOrder.customerPhone}</p>
                {selectedOrder.customerCompany && (
                  <p className="text-xs text-slate-500 mt-0.5 italic">{selectedOrder.customerCompany}</p>
                )}
                {selectedOrder.utmSource && (
                  <p className="text-[11px] text-blue-600 font-medium mt-2">
                    Attribution: {selectedOrder.utmSource} / {selectedOrder.utmMedium}
                  </p>
                )}
              </div>

              {/* Payment Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Status Pembayaran
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Metode:</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">Total Tagihan:</span>
                  <span className="font-black text-blue-600 text-sm">{formatRupiah(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{selectedOrder.transactionId || '-'}</span>
                </div>
                {selectedOrder.licenseKey && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-700 font-bold block">License Key:</span>
                      <span className="font-mono text-xs font-bold text-slate-900">{selectedOrder.licenseKey}</span>
                    </div>
                    <button
                      onClick={handleResetLicense}
                      disabled={actionLoading}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold cursor-pointer transition-colors"
                      title="Reset limit aktivasi perangkat kembali ke 0"
                    >
                      Reset Aktivasi
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* DOWNLOAD PROTECTION & ACCESS CONTROL PANEL (PHASE 2) */}
            {selectedOrder.downloadToken && (
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Manajemen Perlindungan Tautan Unduhan (Vault)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Token: {selectedOrder.downloadToken}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        downloadDetails?.isRevoked
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {downloadDetails?.isRevoked ? 'AKSES DICABUT (REVOKED)' : 'STATUS AKTIF'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Penggunaan Kuota</span>
                    <span className="text-base font-black text-white font-mono mt-0.5 block">
                      {downloadDetails?.downloadCount || 0} / {downloadDetails?.downloadLimit || 10}x
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Sisa: {Math.max(0, (downloadDetails?.downloadLimit || 10) - (downloadDetails?.downloadCount || 0))}x unduhan
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Masa Berlaku</span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {downloadDetails?.expiresAt ? new Date(downloadDetails.expiresAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Token Terenkripsi
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-center gap-1.5">
                    <button
                      onClick={handleResetQuota}
                      disabled={actionLoading}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Reset Kuota (0/{downloadDetails?.downloadLimit || 10})
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleExtendExpiry}
                        disabled={actionLoading}
                        className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                      >
                        +30 Hari
                      </button>
                      <button
                        onClick={handleToggleRevoke}
                        disabled={actionLoading}
                        className={`flex-1 py-1 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center ${
                          downloadDetails?.isRevoked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-900/60 hover:bg-red-800 text-red-200'
                        }`}
                      >
                        {downloadDetails?.isRevoked ? 'Aktifkan' : 'Cabut'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Download Logs */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{showLogs ? 'Sembunyikan' : 'Lihat'} Jejak Unduhan (Download Logs: {downloadLogs.length})</span>
                  </button>

                  {showLogs && (
                    <div className="mt-3 max-h-40 overflow-y-auto rounded-xl bg-slate-950 p-2 border border-slate-800 text-[11px] font-mono">
                      {downloadLogs.length === 0 ? (
                        <p className="text-slate-500 p-2 text-center">Customer belum mengunduh file ini.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {downloadLogs.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-2 rounded bg-slate-900/80 text-slate-300">
                              <div>
                                <span className="font-bold text-white block">{log.fileName}</span>
                                <span className="text-[10px] text-slate-500">{formatDateTime(log.downloadedAt)}</span>
                              </div>
                              <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded">
                                IP: {log.ipAddress}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Purchased Items List */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Item Pembelian ({selectedOrder.items.length})
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.productName}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{item.itemType}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatRupiah(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ======================================================== */}
            {/* REAL-TIME ORDER TIMELINE (REQUIRED BY SPEC)              */}
            {/* ======================================================== */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Kronologi & Timeline Pesanan Lengkap</span>
              </h4>

              <div className="space-y-4 pl-2 border-l-2 border-slate-200">
                {selectedOrder.timeline?.map((tl) => (
                  <div key={tl.id} className="relative pl-6">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 text-xs">{tl.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(tl.timestamp)}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 rounded bg-slate-100 text-slate-600">
                          {tl.actor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {tl.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Catatan Internal Admin:
              </label>
              <textarea
                rows={2}
                placeholder="Tambahkan catatan untuk pesanan ini..."
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
