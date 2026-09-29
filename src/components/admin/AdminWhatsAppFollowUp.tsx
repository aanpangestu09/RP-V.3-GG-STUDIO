import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  Settings2, 
  Phone, 
  Sparkles, 
  HelpCircle, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  RefreshCw,
  Eye,
  X,
  Zap,
  Tag,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { FollowUpCategory, FollowUpRuleConfig, WhatsAppFollowUpSettings, NotificationLog } from '../../types/schema';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/formatters';
import { useStoreSettings } from '../../context/StoreContext';

// Default templates for reset
const DEFAULT_TEMPLATES = {
  waitingPayment: `Halo {nama_pembeli} 👋\n\nTerima kasih telah memesan *{nama_produk}*.\n\nPesanan Anda dengan nomor *{nomor_order}* sebesar *{total_harga}* saat ini masih menunggu penyelesaian pembayaran.\n\nSegera selesaikan pembayaran melalui tautan berikut sebelum batas waktu berakhir:\n👉 {link_pembayaran}\n\nJika Anda mengalami kendala saat transfer atau butuh bantuan rekening, jangan ragu untuk membalas pesan ini ya! 🙏`,
  paid: `Halo {nama_pembeli} 🎉\n\nPembayaran untuk pesanan *{nomor_order}* telah kami terima dan terverifikasi LUNAS!\n\nRincian Pesanan:\n• Produk: *{nama_produk}*\n• Total: {total_harga}\n• Status: Lunas & Terkirim\n\nAkses & unduh file produk digital Anda langsung melalui tautan di bawah ini:\n🚀 {link_produk}\n\nTerima kasih atas kepercayaannya. Semoga produk ini bermanfaat maksimal untuk pekerjaan dan proyek Anda! ✨`,
  expiredFailed: `Halo {nama_pembeli},\n\nKami melihat bahwa pesanan *{nomor_order}* untuk *{nama_produk}* telah kedaluwarsa atau belum berhasil diselesaikan.\n\nApakah Anda masih berminat untuk mendapatkan produk ini?\nKhusus hari ini, Anda bisa memesan ulang dan mengamankan penawaran terbaik melalui tautan berikut:\n👉 {link_pembayaran}\n\nJika ada kendala metode pembayaran atau pertanyaan seputar produk, kami siap membantu!`
};

const SAMPLE_VARS = {
  nama_pembeli: 'Rian Pratama, S.T.',
  nama_produk: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
  total_harga: 'Rp 219.000',
  link_pembayaran: 'https://ruangproyek.id/checkout/10000-template-arsitektur-pro?order=ORD-2026-9921',
  link_produk: 'https://ruangproyek.id/download/tok_secure_sample_992182',
  nomor_order: 'ORD-20260929-9921'
};

const VARIABLE_TAGS = [
  { key: '{nama_pembeli}', label: 'Nama Pembeli', desc: 'Nama lengkap pelanggan' },
  { key: '{nama_produk}', label: 'Nama Produk', desc: 'Judul produk yang dipesan' },
  { key: '{total_harga}', label: 'Total Harga', desc: 'Nominal total pembayaran' },
  { key: '{link_pembayaran}', label: 'Link Pembayaran', desc: 'URL pembayaran / checkout' },
  { key: '{link_produk}', label: 'Link Produk', desc: 'URL download akses file digital' },
  { key: '{nomor_order}', label: 'Nomor Order', desc: 'Kode invoice/pesanan' },
];

export const AdminWhatsAppFollowUp: React.FC = () => {
  const { storeProfile } = useStoreSettings();

  // Settings State
  const [settings, setSettings] = useState<WhatsAppFollowUpSettings>({
    provider: 'FONNTE',
    apiKey: 'fonnte_live_tok_9918237198',
    senderNumber: '6281234567890',
    rules: {
      waitingPayment: {
        isEnabled: true,
        delayMinutes: 15,
        template: DEFAULT_TEMPLATES.waitingPayment
      },
      paid: {
        isEnabled: true,
        delayMinutes: 0,
        template: DEFAULT_TEMPLATES.paid
      },
      expiredFailed: {
        isEnabled: false,
        delayMinutes: 60,
        template: DEFAULT_TEMPLATES.expiredFailed
      }
    }
  });

  const [activeCategory, setActiveCategory] = useState<'waitingPayment' | 'paid' | 'expiredFailed'>('waitingPayment');
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Test send dialog state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState(storeProfile.supportWhatsapp || '6281234567890');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Trigger auto follow up state
  const [isTriggering, setIsTriggering] = useState(false);

  // Settings Provider Dialog
  const [isProviderConfigOpen, setIsProviderConfigOpen] = useState(false);

  // Detail preview modal
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  // Fetch initial configuration & logs
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, logsData] = await Promise.all([
        api.getFollowUpSettings(),
        api.getFollowUpLogs()
      ]);

      if (settingsData && settingsData.rules) {
        setSettings(settingsData);
      }
      if (logsData) {
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp Follow-Up data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update current template
  const handleTemplateChange = (text: string) => {
    setSettings(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [activeCategory]: {
          ...prev.rules[activeCategory],
          template: text
        }
      }
    }));
  };

  // Toggle active rule
  const handleToggleRule = (cat: 'waitingPayment' | 'paid' | 'expiredFailed') => {
    setSettings(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [cat]: {
          ...prev.rules[cat],
          isEnabled: !prev.rules[cat].isEnabled
        }
      }
    }));
  };

  // Update delay minutes
  const handleDelayChange = (cat: 'waitingPayment' | 'paid' | 'expiredFailed', minutes: number) => {
    setSettings(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [cat]: {
          ...prev.rules[cat],
          delayMinutes: minutes
        }
      }
    }));
  };

  // Insert variable into template
  const insertVariable = (variableKey: string) => {
    const currentText = settings.rules[activeCategory].template;
    handleTemplateChange(currentText + ' ' + variableKey + ' ');
  };

  // Reset template to default
  const handleResetToDefault = () => {
    handleTemplateChange(DEFAULT_TEMPLATES[activeCategory]);
    setSuccessToast(`Template untuk ${activeCategoryTitle} berhasil di-reset ke bawaan.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessToast('');
    setErrorToast('');
    try {
      const res = await api.updateFollowUpSettings(settings);
      if (res.success) {
        setSuccessToast('Pengaturan & template Follow Up WhatsApp berhasil disimpan!');
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        setErrorToast(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      setErrorToast(err?.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run Test Send
  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, message: 'Nomor WhatsApp tujuan wajib diisi.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.sendFollowUpTest({
        phone: testPhone.trim(),
        category: activeCategory,
        customMessage: settings.rules[activeCategory].template
      });

      if (res.success) {
        setTestResult({ success: true, message: res.message });
        const refreshedLogs = await api.getFollowUpLogs();
        setLogs(refreshedLogs);
      } else {
        setTestResult({ success: false, message: res.message || 'Gagal mengirim pesan uji coba.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Gagal menghubungi server WhatsApp gateway.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Trigger Now
  const handleTriggerNow = async () => {
    setIsTriggering(true);
    try {
      const res = await api.triggerFollowUpNow();
      if (res.success) {
        setSuccessToast(res.message);
        const refreshedLogs = await api.getFollowUpLogs();
        setLogs(refreshedLogs);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Resend specific log
  const handleResendLog = async (logId: string) => {
    try {
      const res = await api.resendFollowUpMessage(logId);
      if (res.success) {
        setSuccessToast(`Pesan berhasil dikirim ulang!`);
        const refreshedLogs = await api.getFollowUpLogs();
        setLogs(refreshedLogs);
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live WhatsApp preview text generator
  const currentTemplate = settings.rules[activeCategory]?.template || '';
  const renderedPreview = currentTemplate
    .replace(/\{nama_pembeli\}/gi, SAMPLE_VARS.nama_pembeli)
    .replace(/\{nama_produk\}/gi, SAMPLE_VARS.nama_produk)
    .replace(/\{total_harga\}/gi, SAMPLE_VARS.total_harga)
    .replace(/\{link_pembayaran\}/gi, SAMPLE_VARS.link_pembayaran)
    .replace(/\{link_produk\}/gi, SAMPLE_VARS.link_produk)
    .replace(/\{nomor_order\}/gi, SAMPLE_VARS.nomor_order);

  // Active Category Meta
  const activeCategoryTitle = 
    activeCategory === 'waitingPayment' ? 'Menunggu Pembayaran (Belum Bayar)' :
    activeCategory === 'paid' ? 'Lunas (Pesanan Berhasil)' :
    'Gagal / Kadaluarsa';

  if (isLoading) {
    return (
      <div className="text-center py-24 text-slate-400 font-semibold text-xs animate-pulse">
        Memuat data Auto Follow-Up WhatsApp...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ======================================================== */}
      {/* 1. PAGE HEADER                                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                WhatsApp
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Auto
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Automasi follow-up pengingat pembayaran, konfirmasi lunas, dan pemulihan order.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsProviderConfigOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan API Provider</span>
          </button>

          <button
            onClick={handleTriggerNow}
            disabled={isTriggering}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Scan dan jalankan pengiriman follow-up untuk order yang memenuhi syarat sekarang"
          >
            <Play className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : 'fill-white'}`} />
            <span>{isTriggering ? 'Memproses...' : 'Jalankan Antrean Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-bold border border-red-200 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BAGIAN ATAS: TOGGLE ON/OFF PER KATEGORI FOLLOW-UP     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kategori 1: Menunggu Pembayaran */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.rules.waitingPayment.isEnabled
            ? 'bg-white border-emerald-300 shadow-sm shadow-emerald-500/5'
            : 'bg-slate-50 border-slate-200 opacity-75'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block">
                Status: Menunggu
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                Pengingat Belum Bayar
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Kirim pesan WA pengingat untuk segera menyelesaikan pembayaran checkout.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleRule('waitingPayment')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.rules.waitingPayment.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.rules.waitingPayment.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Jeda Waktu Kirim:</span>
            <select
              value={settings.rules.waitingPayment.delayMinutes}
              onChange={(e) => handleDelayChange('waitingPayment', parseInt(e.target.value))}
              disabled={!settings.rules.waitingPayment.isEnabled}
              className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <option value={15}>15 Menit</option>
              <option value={30}>30 Menit</option>
              <option value={60}>1 Jam</option>
              <option value={360}>6 Jam</option>
              <option value={1440}>24 Jam</option>
            </select>
          </div>
        </div>

        {/* Kategori 2: Order Lunas */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.rules.paid.isEnabled
            ? 'bg-white border-emerald-300 shadow-sm shadow-emerald-500/5'
            : 'bg-slate-50 border-slate-200 opacity-75'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                Status: Lunas
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                Terima Kasih & Akses File
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Kirim ucapan terima kasih beserta tautan instan download produk digital.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleRule('paid')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.rules.paid.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.rules.paid.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Jeda Waktu Kirim:</span>
            <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded">
              Instan (Detik Itu Juga)
            </span>
          </div>
        </div>

        {/* Kategori 3: Order Kadaluarsa / Gagal */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.rules.expiredFailed.isEnabled
            ? 'bg-white border-emerald-300 shadow-sm shadow-emerald-500/5'
            : 'bg-slate-50 border-slate-200 opacity-75'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 inline-block">
                Status: Kadaluarsa / Gagal
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                Penawaran Ulang & Diskon
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Follow-up calon pembeli yang transaksinya expired dengan reminder/promo.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleRule('expiredFailed')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.rules.expiredFailed.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.rules.expiredFailed.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Jeda Waktu Kirim:</span>
            <select
              value={settings.rules.expiredFailed.delayMinutes}
              onChange={(e) => handleDelayChange('expiredFailed', parseInt(e.target.value))}
              disabled={!settings.rules.expiredFailed.isEnabled}
              className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <option value={30}>30 Menit</option>
              <option value={60}>1 Jam</option>
              <option value={180}>3 Jam</option>
              <option value={720}>12 Jam</option>
              <option value={1440}>24 Jam</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BAGIAN TENGAH: EDITOR TEMPLATE PESAN & LIVE PREVIEW   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto">
          {[
            { id: 'waitingPayment', label: '1. Menunggu Pembayaran', badge: settings.rules.waitingPayment.isEnabled ? 'Aktif' : 'Off' },
            { id: 'paid', label: '2. Pembayaran Lunas', badge: settings.rules.paid.isEnabled ? 'Aktif' : 'Off' },
            { id: 'expiredFailed', label: '3. Kadaluarsa / Gagal', badge: settings.rules.expiredFailed.isEnabled ? 'Aktif' : 'Off' },
          ].map(tab => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-t-2 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white border-emerald-600 text-slate-900 shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  tab.badge === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Editor & Preview Split Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Textarea & Dynamic Variable Inserter (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Editor Template ({activeCategoryTitle})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Gunakan format WhatsApp: <code>*tebal*</code>, <code>_miring_</code>, atau <code>~coret~</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Reset template kategori ini ke bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan ke Default</span>
              </button>
            </div>

            {/* Inserter Tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Klik Variabel untuk Menyisipkan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_TAGS.map(tag => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => insertVariable(tag.key)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200/80 transition-colors cursor-pointer"
                    title={`Sisipkan ${tag.desc}`}
                  >
                    + {tag.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={settings.rules[activeCategory].template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                rows={11}
                placeholder="Tulis pesan template WhatsApp Anda di sini..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed transition-all shadow-inner"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Panjang: {settings.rules[activeCategory].template.length} karakter</span>
                <span>Variabel dinamis akan otomatis diganti saat pesan dikirim</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Template'}</span>
              </button>

              <button
                onClick={() => {
                  setTestResult(null);
                  setIsTestModalOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim Pesan Uji Coba (Test Send)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real-Time WhatsApp Phone Mockup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Pratinjau WhatsApp Real-Time
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Data Contoh Pembeli
                </span>
              </div>

              {/* iPhone Mockup Frame */}
              <div className="rounded-[32px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                {/* Screen Container */}
                <div className="rounded-[24px] bg-[#0b141a] overflow-hidden flex flex-col h-[460px]">
                  {/* WhatsApp App Header */}
                  <div className="bg-[#1f2c34] p-3 flex items-center gap-3 text-white border-b border-white/5">
                    <img
                      src={storeProfile.logoUrl}
                      alt={storeProfile.businessName}
                      className="w-9 h-9 rounded-full object-cover bg-white/10 p-0.5 border border-white/20 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
                      }}
                    />
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs truncate block text-white">
                          {storeProfile.businessName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <span className="text-[10px] text-emerald-400 block font-medium">
                        Online (Official Business)
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Body with Authentic Pattern Background */}
                  <div 
                    className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b141a] flex flex-col justify-end"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(18, 140, 126, 0.05) 0%, transparent 80%)`
                    }}
                  >
                    {/* Timestamp Bubble */}
                    <div className="text-center">
                      <span className="bg-[#182229] text-[10px] text-slate-400 px-2 py-0.5 rounded-md font-medium">
                        Hari ini
                      </span>
                    </div>

                    {/* WhatsApp Green Outgoing Bubble */}
                    <div className="self-end max-w-[92%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-xs p-3 shadow-sm space-y-1.5 border border-[#02735e]/30">
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans break-words select-none">
                        {renderedPreview}
                      </div>

                      {/* Message Footer (Time & Blue Double Ticks) */}
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                        <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Bottom Input Bar Mockup */}
                  <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-white/5">
                    <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-[11px] text-slate-400 truncate">
                      Ketik pesan...
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BAGIAN BAWAH: LOG RIWAYAT PENGIRIMAN WA               */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Log Riwayat Pengiriman WhatsApp
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {logs.length} Pesan
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh pesan auto follow-up dan reminder yang berhasil dikirimkan ke nomor pembeli.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Log</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Tujuan (Nomor WA)</th>
                <th className="py-3 px-6">Subjek / Kategori</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Waktu Pengiriman</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada riwayat follow-up WhatsApp yang tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 font-mono">
                      {log.recipient}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 max-w-xs truncate">
                      {log.subjectOrTitle}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCheck className="w-3 h-3" /> Terkirim
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(log.sentAt)}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Lihat Isi
                      </button>
                      <button
                        onClick={() => handleResendLog(log.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                        title="Kirim ulang pesan ini ke nomor tujuan"
                      >
                        Kirim Ulang
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
      {/* 5. MODAL: PENGATURAN API PROVIDER WHATSAPP               */}
      {/* ======================================================== */}
      {isProviderConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pengaturan API Gateway WhatsApp
                  </h3>
                  <span className="text-[11px] text-slate-400">Kredensial Pengiriman Pesan</span>
                </div>
              </div>
              <button onClick={() => setIsProviderConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penyedia WhatsApp Gateway
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="FONNTE">Fonnte (Rekomendasi Bawaan)</option>
                  <option value="WABLAS">Wablas</option>
                  <option value="WHATSAPP_CLOUD">WhatsApp Cloud API (Meta Official)</option>
                  <option value="STARSENDER">Starsender</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fonnte mendukung pengiriman instan tanpa scan QR berkala dan webhook penerimaan pesan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  API Key / Token Gateway
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Masukkan API Token Provider"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Pengirim (Device Number)
                </label>
                <input
                  type="text"
                  value={settings.senderNumber}
                  onChange={(e) => setSettings({ ...settings, senderNumber: e.target.value })}
                  placeholder="628123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Jika dikosongkan, otomatis menggunakan nomor WhatsApp toko: <code>{storeProfile.supportWhatsapp}</code>.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProviderConfigOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveSettings();
                    setIsProviderConfigOpen(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: KIRIM PESAN UJI COBA (TEST SEND)               */}
      {/* ======================================================== */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Kirim Uji Coba WhatsApp
                </h3>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Kirim pesan contoh dengan template <strong>{activeCategoryTitle}</strong> ke nomor tujuan Anda untuk memastikan pesan diterima dengan baik di aplikasi WhatsApp.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp Tujuan:
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Contoh: 6281234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Mengirim...' : 'Kirim Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: LIHAT DETAIL LOG PESAN TERKIRIM                */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Isi Pesan WhatsApp Terkirim
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Nomor Tujuan:</span>
                <span className="text-xs font-mono font-bold text-slate-900">{selectedLog.recipient}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kategori / Subjek:</span>
                <span className="text-xs font-bold text-slate-900">{selectedLog.subjectOrTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Waktu Pengiriman:</span>
                <span className="text-xs font-mono text-slate-600">{formatDateTime(selectedLog.sentAt)}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Teks Pesan WhatsApp:</span>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
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
