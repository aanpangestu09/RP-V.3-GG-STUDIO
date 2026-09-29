import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Play, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Code, 
  Zap, 
  Check, 
  Layers, 
  Globe,
  Radio,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatRupiah, formatDateTime } from '../../lib/formatters';

// Brand SVG Icons
const FacebookIcon = () => (
  <div className="w-6 h-6 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  </div>
);

const TikTokIcon = () => (
  <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  </div>
);

const GoogleIcon = () => (
  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm p-0.5">
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  </div>
);

const GTMIcon = () => (
  <div className="w-6 h-6 rounded-lg bg-[#246FDB] flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v8l8 4 8-4v-8l-8 4z" />
    </svg>
  </div>
);

interface TrackingState {
  metaPixelId: string;
  metaCapiToken: string;
  metaTestCode: string;
  metaServerSide: boolean;
  tiktokPixelId: string;
  tiktokAccessToken: string;
  googleAdsId: string;
  googleAdsLabel: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  snackVideoPixelId: string;
}

export const AdminTrackingPixel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'META' | 'TIKTOK' | 'GOOGLE' | 'GTM' | 'SIMULATOR'>('META');
  const [trackingState, setTrackingState] = useState<TrackingState>({
    metaPixelId: '109283746152839',
    metaCapiToken: 'EAAB91827361928374910283EAAB9921',
    metaTestCode: 'TEST88912',
    metaServerSide: true,
    tiktokPixelId: 'C991827364501',
    tiktokAccessToken: 'tt_access_9918274615243102',
    googleAdsId: 'AW-981273645',
    googleAdsLabel: 'k8sLCPX79v8D',
    googleAnalyticsId: 'G-RP20269988',
    googleTagManagerId: 'GTM-RP001',
    snackVideoPixelId: 'snack_881928371'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);

  // Simulator State
  const [simPlatform, setSimPlatform] = useState('META');
  const [simEvent, setSimEvent] = useState('Purchase');
  const [simValue, setSimValue] = useState('179000');
  const [simOrderId, setSimOrderId] = useState('ORD-TEST-' + Math.floor(1000 + Math.random() * 9000));
  const [isSendingSim, setIsSendingSim] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        api.getSettings(),
        api.getTrackingLogs()
      ]);

      if (settingsRes?.tracking) {
        setTrackingState(prev => ({
          ...prev,
          metaPixelId: settingsRes.tracking.metaPixelId || prev.metaPixelId,
          metaCapiToken: settingsRes.tracking.metaCapiToken || prev.metaCapiToken,
          googleAnalyticsId: settingsRes.tracking.googleAnalyticsId || prev.googleAnalyticsId,
          googleTagManagerId: settingsRes.tracking.googleTagManagerId || prev.googleTagManagerId,
          tiktokPixelId: settingsRes.tracking.tiktokPixelId || prev.tiktokPixelId
        }));
      }

      if (logsRes) {
        setTrackingLogs(logsRes);
      }
    } catch (err) {
      console.error('Failed to load tracking data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      await api.updateSettings({
        tracking: {
          metaPixelId: trackingState.metaPixelId,
          metaCapiToken: trackingState.metaCapiToken,
          googleAnalyticsId: trackingState.googleAnalyticsId,
          googleTagManagerId: trackingState.googleTagManagerId,
          tiktokPixelId: trackingState.tiktokPixelId
        }
      });

      setSaveSuccessMsg('Pengaturan Pixel & Tracking berhasil disimpan dan aktif di seluruh halaman!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save tracking settings', err);
      alert('Gagal menyimpan pengaturan tracking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEvent = async () => {
    setIsSendingSim(true);
    setSimResult(null);
    try {
      const res = await api.sendTestTrackingEvent({
        platform: simPlatform,
        eventName: simEvent,
        value: Number(simValue) || 0,
        orderId: simOrderId
      });

      setSimResult(res);
      // Reload logs
      const updatedLogs = await api.getTrackingLogs();
      setTrackingLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to send test tracking event', err);
    } finally {
      setIsSendingSim(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Pixel
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                CAPI Online
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pelacakan konversi Meta Pixel & CAPI, TikTok Pixel, dan Google Ads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulator Event</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-[#00875a] hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 4 Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta Pixel & CAPI Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FacebookIcon />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Meta Pixel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[120px]">
                {trackingState.metaPixelId || 'Belum Aktif'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            CAPI Active
          </span>
        </div>

        {/* TikTok Pixel Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TikTokIcon />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">TikTok Pixel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[120px]">
                {trackingState.tiktokPixelId || 'Belum Aktif'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Browser
          </span>
        </div>

        {/* Google Ads / GTM Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GTMIcon />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Google Ads & GTM</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[120px]">
                {trackingState.googleTagManagerId || 'GTM-RP001'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            Enhanced
          </span>
        </div>

        {/* Events Recorded Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Event Hari Ini</span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                740 <span className="text-[11px] font-medium text-emerald-600">Events</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            100% Match
          </span>
        </div>
      </div>

      {/* Main Settings & Simulator Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 pt-3 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('META')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'META'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FacebookIcon />
            <span>Meta Pixel & CAPI</span>
          </button>

          <button
            onClick={() => setActiveTab('TIKTOK')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TIKTOK'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TikTokIcon />
            <span>TikTok Pixel</span>
          </button>

          <button
            onClick={() => setActiveTab('GOOGLE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'GOOGLE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GoogleIcon />
            <span>Google Ads & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('GTM')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'GTM'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GTMIcon />
            <span>Google Tag Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SIMULATOR'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Play className="w-4 h-4 text-indigo-600" />
            <span>Uji Coba & Simulator Event</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700">
              TEST
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: META PIXEL & CAPI */}
          {activeTab === 'META' && (
            <div className="space-y-6">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <FacebookIcon />
                <div className="text-xs text-blue-900">
                  <strong className="font-extrabold block">Optimasi Iklan Facebook & Instagram</strong>
                  Sistem mendukung <strong>Meta Conversions API (Server-Side CAPI)</strong> yang mengirimkan event langsung dari backend server. Ini memastikan event Purchase & InitiateCheckout tetap terdeteksi 100% meskipun calon pembeli mengaktifkan ad-blocker atau menggunakan browser Safari/iOS 14.5+.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pixel ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Meta Pixel ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingState.metaPixelId}
                    onChange={(e) => setTrackingState({ ...trackingState, metaPixelId: e.target.value })}
                    placeholder="Contoh: 109283746152839"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dapat dilihat di Meta Events Manager → Pengaturan Sumber Data.
                  </p>
                </div>

                {/* Test Event Code */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Test Event Code (Opsional)
                  </label>
                  <input
                    type="text"
                    value={trackingState.metaTestCode}
                    onChange={(e) => setTrackingState({ ...trackingState, metaTestCode: e.target.value })}
                    placeholder="Contoh: TEST88912"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Masukkan kode dari tab "Uji Peristiwa" di Events Manager untuk melihat event langsung.
                  </p>
                </div>
              </div>

              {/* CAPI Token */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Conversions API (CAPI) Access Token
                </label>
                <textarea
                  rows={2}
                  value={trackingState.metaCapiToken}
                  onChange={(e) => setTrackingState({ ...trackingState, metaCapiToken: e.target.value })}
                  placeholder="Contoh: EAAB..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dihasilkan dari tab Pengaturan Events Manager → Buat Token Akses.
                </p>
              </div>

              {/* Server-side CAPI Toggle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Kirim Event Server-Side (CAPI Deduplication)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Otomatis menyinkronkan eventId browser & server untuk mencegah duplikasi data di Meta Ads.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackingState.metaServerSide}
                    onChange={(e) => setTrackingState({ ...trackingState, metaServerSide: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Event Triggers List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2.5">
                  Event Standar yang Otomatis Dikirimkan:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'PageView', desc: 'Saat pengunjung membuka halaman produk atau checkout' },
                    { name: 'ViewContent', desc: 'Saat pengunjung melihat deskripsi detail produk' },
                    { name: 'InitiateCheckout', desc: 'Saat pengunjung mengisi form checkout' },
                    { name: 'AddPaymentInfo', desc: 'Saat pengunjung memilih QRIS / VA di checkout' },
                    { name: 'Purchase', desc: 'Saat pembayaran diverifikasi LUNAS (berisi total amount)' }
                  ].map((evt, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-xs text-slate-900">{evt.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{evt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIKTOK PIXEL */}
          {activeTab === 'TIKTOK' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-start gap-3">
                <TikTokIcon />
                <div className="text-xs text-slate-300">
                  <strong className="font-extrabold text-white block">TikTok Pixel & Events API</strong>
                  Lacak konversi kampanye TikTok Ads secara real-time. Cocok untuk toko yang menjalankan traffic dari TikTok Creator atau Spark Ads.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    TikTok Pixel ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingState.tiktokPixelId}
                    onChange={(e) => setTrackingState({ ...trackingState, tiktokPixelId: e.target.value })}
                    placeholder="Contoh: C991827364501"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Diperoleh dari TikTok Ads Manager → Assets → Event.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    TikTok Events API Access Token (Opsional)
                  </label>
                  <input
                    type="text"
                    value={trackingState.tiktokAccessToken}
                    onChange={(e) => setTrackingState({ ...trackingState, tiktokAccessToken: e.target.value })}
                    placeholder="Contoh: tt_access_..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Untuk pelacakan server-side TikTok Events API.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Event TikTok yang Didukung:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['ViewContent', 'InitiateCheckout', 'AddPaymentInfo', 'CompletePayment'].map((evt) => (
                    <span key={evt} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-800">
                      ✓ {evt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE ADS & ANALYTICS */}
          {activeTab === 'GOOGLE' && (
            <div className="space-y-6">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                <GoogleIcon />
                <div className="text-xs text-amber-900">
                  <strong className="font-extrabold block">Google Ads & Google Analytics 4 (GA4)</strong>
                  Kirim sinyal konversi ke Google Ads untuk Smart Bidding (Target CPA / Target ROAS) dan rekam data funnel di Google Analytics 4.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Google Ads Conversion ID
                  </label>
                  <input
                    type="text"
                    value={trackingState.googleAdsId}
                    onChange={(e) => setTrackingState({ ...trackingState, googleAdsId: e.target.value })}
                    placeholder="Contoh: AW-981273645"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: AW-XXXXXXXXX
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Conversion Label (Purchase Event)
                  </label>
                  <input
                    type="text"
                    value={trackingState.googleAdsLabel}
                    onChange={(e) => setTrackingState({ ...trackingState, googleAdsLabel: e.target.value })}
                    placeholder="Contoh: k8sLCPX79v8D"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Label tindakan konversi Pembelian di Google Ads.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Google Analytics 4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={trackingState.googleAnalyticsId}
                    onChange={(e) => setTrackingState({ ...trackingState, googleAnalyticsId: e.target.value })}
                    placeholder="Contoh: G-RP20269988"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: G-XXXXXXXXXX
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE TAG MANAGER */}
          {activeTab === 'GTM' && (
            <div className="space-y-6">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <GTMIcon />
                <div className="text-xs text-blue-900">
                  <strong className="font-extrabold block">Google Tag Manager (GTM Container)</strong>
                  Jika Anda ingin mengelola semua tag pihak ketiga (Hotjar, Clarity, Twitter Pixel, dll) di satu tempat, masukkan Container ID GTM Anda.
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  GTM Container ID
                </label>
                <input
                  type="text"
                  value={trackingState.googleTagManagerId}
                  onChange={(e) => setTrackingState({ ...trackingState, googleTagManagerId: e.target.value })}
                  placeholder="Contoh: GTM-XXXXXXX"
                  className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Script GTM akan otomatis diinjeksikan ke dalam header dan body setiap halaman.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Event DataLayer yang Didukung Otomatis:
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
{`window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'ORD-2026-0928-8921',
    value: 266000,
    currency: 'IDR',
    items: [{ item_name: 'Buku Kas Digital Pro', price: 266000 }]
  }
});`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: SIMULATOR EVENT */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Play className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <strong className="font-extrabold block">Uji Coba Pengiriman Event (Event Simulator)</strong>
                  Gunakan simulator ini untuk menguji apakah webhook dan pixel Anda menerima event secara tepat tanpa harus melakukan pembelian riil.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Platform Tujuan
                  </label>
                  <select
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="META">Meta (Facebook & CAPI)</option>
                    <option value="TIKTOK">TikTok Pixel</option>
                    <option value="GOOGLE">Google Ads / GA4</option>
                    <option value="GTM">Google Tag Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Event Type
                  </label>
                  <select
                    value={simEvent}
                    onChange={(e) => setSimEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Purchase">Purchase (Pembayaran Lunas)</option>
                    <option value="InitiateCheckout">InitiateCheckout (Mulai Checkout)</option>
                    <option value="ViewContent">ViewContent (Lihat Produk)</option>
                    <option value="PageView">PageView (Buka Halaman)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nilai Transaksi (Rp)
                  </label>
                  <input
                    type="number"
                    value={simValue}
                    onChange={(e) => setSimValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Order ID Contoh
                  </label>
                  <input
                    type="text"
                    value={simOrderId}
                    onChange={(e) => setSimOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSendTestEvent}
                disabled={isSendingSim}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSendingSim ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Kirim Test Event Sekarang</span>
              </button>

              {/* Simulation Result */}
              {simResult && (
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {simResult.message}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      ID: {simResult.data?.id}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 p-2.5 bg-black/40 rounded-lg overflow-x-auto">
                    {JSON.stringify(simResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Tracking Events Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                Log Event Pixel Real-time
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {trackingLogs.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Daftar sinyal konversi yang berhasil terekam dan disalurkan ke provider pixel.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Muat Ulang Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Waktu</th>
                <th className="py-3 px-5">Platform</th>
                <th className="py-3 px-5">Event</th>
                <th className="py-3 px-5">Nilai (Value)</th>
                <th className="py-3 px-5">Halaman / Order</th>
                <th className="py-3 px-5">IP & Device</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {trackingLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada event tracking yang tercatat.
                  </td>
                </tr>
              ) : (
                trackingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 whitespace-nowrap text-slate-500 text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-5">
                      {log.platform === 'META' ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <FacebookIcon />
                          <span>META</span>
                        </span>
                      ) : log.platform === 'TIKTOK' ? (
                        <span className="px-2 py-0.5 rounded-md bg-black text-white font-bold text-[10px] inline-flex items-center gap-1">
                          <TikTokIcon />
                          <span>TIKTOK</span>
                        </span>
                      ) : log.platform === 'GOOGLE' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] inline-flex items-center gap-1">
                          <GoogleIcon />
                          <span>GOOGLE</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {log.platform}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      {log.eventName}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {log.value ? formatRupiah(log.value) : '-'}
                    </td>
                    <td className="py-3 px-5 max-w-[200px] truncate text-slate-500">
                      {log.orderId ? (
                        <span className="font-mono font-bold text-blue-600 block">{log.orderId}</span>
                      ) : (
                        <span className="truncate block">{log.sourceUrl}</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-[11px] text-slate-500">
                      <span className="font-mono block text-slate-700">{log.ipAddress}</span>
                      <span className="text-[10px] truncate max-w-[140px] block text-slate-400">
                        {log.userAgent}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      {log.status === 'SERVER_CAPI_MATCH' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          CAPI Match
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                          Sent (200 OK)
                        </span>
                      )}
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
