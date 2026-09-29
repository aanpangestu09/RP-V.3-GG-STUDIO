import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  Layers, 
  Copy,
  Check,
  Terminal,
  RotateCw,
  Code2,
  KeyRound,
  FileText,
  Clock,
  ExternalLink,
  Play,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { WebhookLog, Order, TestCaseResult, E2ETestSuiteResult } from '../../types/schema';
import { formatDateTime } from '../../lib/formatters';

type GatewayTab = 'MIDTRANS' | 'XENDIT' | 'TRIPAY' | 'DUITKU' | 'CENTRAL';

export const AdminSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GatewayTab>('MIDTRANS');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('ORD-20260928-000143');

  // E2E Test State
  const [e2eRunning, setE2eRunning] = useState(false);
  const [e2eResult, setE2eResult] = useState<E2ETestSuiteResult | null>(null);

  // Simulator Inputs
  const [grossAmount, setGrossAmount] = useState('219000');
  const [transactionStatus, setTransactionStatus] = useState<string>('settlement');
  
  // Midtrans specific
  const [midtransStatusCode, setMidtransStatusCode] = useState('200');
  const [midtransServerKey, setMidtransServerKey] = useState('SB-Mid-server-TESTKEY-2026');

  // Xendit specific
  const [xenditCallbackToken, setXenditCallbackToken] = useState('xnd_webhook_secret_key');
  const [xenditStatus, setXenditStatus] = useState<'PAID' | 'EXPIRED' | 'PENDING'>('PAID');

  // Tripay specific
  const [tripayPrivateKey, setTripayPrivateKey] = useState('tripay_priv_key_sample');
  const [tripayStatus, setTripayStatus] = useState<'PAID' | 'EXPIRED' | 'FAILED'>('PAID');

  // Duitku specific
  const [duitkuMerchantCode, setDuitkuMerchantCode] = useState('D1234');
  const [duitkuApiKey, setDuitkuApiKey] = useState('duitku_key');
  const [duitkuResultCode, setDuitkuResultCode] = useState('00');

  // Logs & Execution
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [copiedText, setCopiedText] = useState('');

  const loadData = async () => {
    try {
      const metrics = await api.getAdminMetrics();
      if (metrics?.recentOrders) {
        setAvailableOrders(metrics.recentOrders);
        const waiting = metrics.recentOrders.find((o: Order) => o.paymentStatus === 'WAITING_PAYMENT');
        if (waiting) {
          setSelectedOrderNumber(waiting.orderNumber);
          setGrossAmount(waiting.totalAmount.toString());
        } else if (metrics.recentOrders.length > 0) {
          setSelectedOrderNumber(metrics.recentOrders[0].orderNumber);
          setGrossAmount(metrics.recentOrders[0].totalAmount.toString());
        }
      }
      const logs = await api.getWebhookLogs();
      setWebhookLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunE2ETest = async () => {
    setE2eRunning(true);
    try {
      const res = await api.runE2ETestSuite();
      setE2eResult(res);
      await loadData();
    } catch (err: any) {
      alert('Gagal menjalankan test end-to-end: ' + err.message);
    } finally {
      setE2eRunning(false);
    }
  };

  useEffect(() => {
    loadData();
    handleRunE2ETest();
  }, []);

  const handleOrderSelect = (orderNum: string) => {
    setSelectedOrderNumber(orderNum);
    const ord = availableOrders.find(o => o.orderNumber === orderNum);
    if (ord) {
      setGrossAmount(ord.totalAmount.toString());
    }
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Calculate Midtrans signature preview
  const getMidtransSignaturePreview = () => {
    const raw = `${selectedOrderNumber}${midtransStatusCode}${grossAmount}${midtransServerKey}`;
    return `SHA512("${raw}")`;
  };

  // Dispatch Webhook according to selected gateway
  const handleSendWebhook = async () => {
    setIsLoading(true);
    setResponseLog(null);
    try {
      let res: any;

      if (activeTab === 'MIDTRANS') {
        const payload = {
          order_id: selectedOrderNumber,
          status_code: midtransStatusCode,
          gross_amount: grossAmount,
          transaction_status: midtransStatusCode === '200' ? 'settlement' : midtransStatusCode === '407' ? 'expire' : 'deny',
          transaction_id: `MID-TRX-${Date.now()}`,
          signature_key: 'auto_calc_or_sandbox'
        };
        res = await api.triggerMidtransWebhook(payload);
      } else if (activeTab === 'XENDIT') {
        const payload = {
          id: `xnd_inv_${Date.now()}`,
          external_id: selectedOrderNumber,
          status: xenditStatus,
          amount: Number(grossAmount),
          paid_amount: xenditStatus === 'PAID' ? Number(grossAmount) : 0,
          payment_method: 'QRIS',
          updated: new Date().toISOString()
        };
        res = await api.triggerXenditWebhook(payload, xenditCallbackToken);
      } else if (activeTab === 'TRIPAY') {
        const payload = {
          reference: `TP-REF-${Date.now()}`,
          merchant_ref: selectedOrderNumber,
          status: tripayStatus,
          total_amount: Number(grossAmount),
          is_closed_payment: 1
        };
        res = await api.triggerTripayWebhook(payload, 'sandbox_signature_check');
      } else if (activeTab === 'DUITKU') {
        const payload = {
          merchantOrderId: selectedOrderNumber,
          merchantCode: duitkuMerchantCode,
          amount: grossAmount,
          resultCode: duitkuResultCode, // '00' is success
          reference: `DK-${Date.now()}`
        };
        res = await api.triggerDuitkuWebhook(payload);
      } else {
        // Centralized fallback
        res = await api.triggerWebhook({
          orderNumber: selectedOrderNumber.trim(),
          transactionId: `CENTRAL-TRX-${Date.now()}`,
          transactionStatus: transactionStatus as any,
          grossAmount: Number(grossAmount)
        });
      }

      setResponseLog(res);
      // Refresh logs
      const updatedLogs = await api.getWebhookLogs();
      setWebhookLogs(updatedLogs);
    } catch (err: any) {
      setResponseLog({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Replay Webhook
  const handleReplayWebhook = async (logId: string) => {
    setReplayingId(logId);
    try {
      const res = await api.replayWebhook(logId);
      setResponseLog(res);
      const updatedLogs = await api.getWebhookLogs();
      setWebhookLogs(updatedLogs);
    } catch (err: any) {
      alert(`Gagal replay webhook: ${err.message}`);
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengujian otomatis end-to-end, webhook payment gateway (Midtrans, Xendit, Tripay) dan auto-delivery file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunE2ETest}
            disabled={e2eRunning}
            className="px-4 py-2 bg-[#00875a] hover:bg-[#00704a] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {e2eRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{e2eRunning ? 'Menjalankan Test...' : 'Jalankan Test End-to-End'}</span>
          </button>

          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: END-TO-END AUTOMATED TEST SUITE (T1 - T9)       */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  Hasil Pengujian End-to-End
                </h3>
                {e2eResult && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    e2eResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {e2eResult.success ? `✓ ${e2eResult.passedCount}/${e2eResult.totalScenarios} LULUS (100%)` : `✗ ${e2eResult.failedCount} GAGAL`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengujian menyeluruh logika status order, konsistensi metrik dashboard, idempoten pembayaran, dan isolasi data mode test.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunE2ETest}
            disabled={e2eRunning}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${e2eRunning ? 'animate-spin' : ''}`} />
            <span>{e2eRunning ? 'Menguji...' : 'Uji Ulang Skenario'}</span>
          </button>
        </div>

        {/* E2E Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-4 w-56">Skenario Pengujian</th>
                <th className="py-3 px-4">Hasil Diharapkan</th>
                <th className="py-3 px-4">Hasil Aktual</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-60">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {e2eRunning && !e2eResult && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span className="font-semibold text-xs">Sedang mengeksekusi skenario pengujian T1 s/d T9...</span>
                  </td>
                </tr>
              )}

              {e2eResult && e2eResult.results.map((res: TestCaseResult) => (
                <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-center font-mono font-black text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                      {res.id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{res.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {res.expected}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-mono text-[11px]">
                    {res.actual}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        res.passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {res.passed ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-700" />
                          <span>LULUS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-700" />
                          <span>GAGAL</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {res.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {e2eResult && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Waktu eksekusi: {formatDateTime(e2eResult.executedAt)}</span>
            <span className="font-mono text-emerald-700 font-bold">100% Validated by OrderStateMachine & Centralized Metrics</span>
          </div>
        )}
      </div>

      {/* Gateway Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setActiveTab('MIDTRANS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MIDTRANS'
              ? 'bg-[#00875a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Midtrans (SHA512)</span>
        </button>

        <button
          onClick={() => setActiveTab('XENDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'XENDIT'
              ? 'bg-[#00875a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white/50'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Xendit (Callback Token)</span>
        </button>

        <button
          onClick={() => setActiveTab('TRIPAY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'TRIPAY'
              ? 'bg-[#00875a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tripay (HMAC-SHA256)</span>
        </button>

        <button
          onClick={() => setActiveTab('DUITKU')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DUITKU'
              ? 'bg-[#00875a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white/50'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Duitku (MD5 Signature)</span>
        </button>

        <button
          onClick={() => setActiveTab('CENTRAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CENTRAL'
              ? 'bg-[#00875a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Centralized Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Webhook Dispatcher Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Kirim Webhook: {activeTab}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
              /api/webhooks/{activeTab.toLowerCase() === 'central' ? 'payment' : activeTab.toLowerCase()}
            </span>
          </div>

          {/* Target Order Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Nomor Order Target:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedOrderNumber}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              >
                {availableOrders.map((ord) => (
                  <option key={ord.id} value={ord.orderNumber}>
                    {ord.orderNumber} - {ord.customerName} ({ord.paymentStatus}) - Rp {ord.totalAmount.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pilih order berstatus WAITING_PAYMENT untuk menguji alur otomatis aktivasi produk digital.
            </p>
          </div>

          {/* TAB 1: MIDTRANS CONTROLS */}
          {activeTab === 'MIDTRANS' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Midtrans Status Code
                  </label>
                  <select
                    value={midtransStatusCode}
                    onChange={(e) => setMidtransStatusCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="200">200 (Settlement / Berhasil Lunas)</option>
                    <option value="201">201 (Pending / Menunggu Pembayaran)</option>
                    <option value="202">202 (Deny / Transaksi Ditolak)</option>
                    <option value="407">407 (Expire / Kadaluarsa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Gross Amount (IDR)
                  </label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">Rumus Signature SHA512 Midtrans:</span>
                <code className="text-[11px] text-blue-600 block break-all font-mono">
                  {getMidtransSignaturePreview()}
                </code>
              </div>
            </div>
          )}

          {/* TAB 2: XENDIT CONTROLS */}
          {activeTab === 'XENDIT' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Invoice Status (Xendit)
                  </label>
                  <select
                    value={xenditStatus}
                    onChange={(e) => setXenditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="PAID">PAID (Invoice Lunas)</option>
                    <option value="EXPIRED">EXPIRED (Invoice Kadaluarsa)</option>
                    <option value="PENDING">PENDING (Menunggu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Paid Amount (IDR)
                  </label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  x-callback-token (Header)
                </label>
                <input
                  type="text"
                  value={xenditCallbackToken}
                  onChange={(e) => setXenditCallbackToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TRIPAY CONTROLS */}
          {activeTab === 'TRIPAY' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tripay Transaction Status
                  </label>
                  <select
                    value={tripayStatus}
                    onChange={(e) => setTripayStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="PAID">PAID (Lunas)</option>
                    <option value="EXPIRED">EXPIRED (Kadaluarsa)</option>
                    <option value="FAILED">FAILED (Gagal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Sistem menghitung HMAC-SHA256 dari payload JSON menggunakan Private Key Tripay.
              </p>
            </div>
          )}

          {/* TAB 4: DUITKU CONTROLS */}
          {activeTab === 'DUITKU' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Duitku Result Code
                  </label>
                  <select
                    value={duitkuResultCode}
                    onChange={(e) => setDuitkuResultCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="00">00 (Success / Pembayaran Berhasil)</option>
                    <option value="01">01 (Failed / Transaksi Gagal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CENTRALIZED SANDBOX */}
          {activeTab === 'CENTRAL' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Event Status Gateway
                </label>
                <select
                  value={transactionStatus}
                  onChange={(e) => setTransactionStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="settlement">settlement (Lunas / Berhasil) → Trigger Auto-Delivery</option>
                  <option value="pending">pending (Menunggu Transfer)</option>
                  <option value="expire">expire (Kadaluarsa)</option>
                  <option value="deny">deny (Ditolak / Gagal)</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleSendWebhook}
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Webhook & Mengirim Delivery...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Eksekusi Simulasi Webhook ({activeTab})</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Response Inspector & Explanation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>SERVER RESPONSE & VERIFICATION</span>
              </div>
              {responseLog && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseLog, null, 2))}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Tersalin' : 'Copy'}</span>
                </button>
              )}
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto min-h-56 leading-relaxed">
              {responseLog
                ? JSON.stringify(responseLog, null, 2)
                : '// Klik tombol "Eksekusi Simulasi Webhook" untuk melihat respons verifikasi backend dan payload delivery.'}
            </pre>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2 shadow-sm">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Mekanisme Idempotency & Delivery Otomatis</span>
            </h4>
            <p className="leading-relaxed">
              Ketika status berbuah menjadi <strong>settlement</strong> atau <strong>PAID</strong>, sistem backend secara otomatis:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Membangkitkan token unduhan acak kriptografis (misal: <code>sec_8f7b...</code>)</li>
              <li>Menerbitkan serial lisensi software jika produk berkategori software/kursus</li>
              <li>Mengirimkan notifikasi WhatsApp & Email HTML langsung ke data customer</li>
              <li>Mencegah double-credit jika webhook gateway mengirim ulang payload identik (Idempotent hash)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* WEBHOOK EVENT AUDIT TRAIL & REPLAY LOGS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Riwayat Webhook Log & Fitur Replay
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {webhookLogs.length} events terekam
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Target Order</th>
                <th className="py-3 px-4">Status & Signature</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {webhookLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada log webhook yang tercatat. Lakukan simulasi pengiriman webhook di atas.
                  </td>
                </tr>
              ) : (
                webhookLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(log.processedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-mono">
                        {log.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {log.eventName}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-bold">
                      {log.payload?.orderNumber || log.payload?.order_id || log.payload?.external_id || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'PROCESSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.signatureValid !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            (Sig: {log.signatureValid ? '✓' : 'Bypass'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReplayWebhook(log.id)}
                        disabled={replayingId === log.id}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Jalankan ulang webhook ini secara manual"
                      >
                        <RotateCw className={`w-3 h-3 ${replayingId === log.id ? 'animate-spin' : ''}`} />
                        <span>Replay</span>
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

