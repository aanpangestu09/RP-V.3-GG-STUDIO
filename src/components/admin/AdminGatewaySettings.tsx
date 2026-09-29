import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Mail, 
  Phone, 
  MessageSquare, 
  HardDrive, 
  Share2, 
  Save, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { PlatformSettings } from '../../types/schema';
import { api } from '../../lib/api';

export const AdminGatewaySettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'whatsapp' | 'telegram' | 'email' | 'tracking' | 'storage'>('payment');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !settings) {
    return <div className="text-center py-20 text-slate-400">Memuat konfigurasi gateway...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Koneksi Midtrans, Xendit, WhatsApp Gateway, Telegram, dan Email.
          </p>
        </div>

        {isSaved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 animate-bounce">
            <Check className="w-4 h-4" /> Pengaturan Berhasil Disimpan
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
          { id: 'whatsapp', label: 'WhatsApp API', icon: Phone },
          { id: 'telegram', label: 'Notifikasi Telegram', icon: MessageSquare },
          { id: 'email', label: 'SMTP Email', icon: Mail },
          { id: 'tracking', label: 'Pixel & Tracking', icon: Share2 },
          { id: 'storage', label: 'Cloud Storage S3', icon: HardDrive },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#00875a] text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* PAYMENT GATEWAY CONFIG */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Integrasi Payment Gateway (QRIS, VA & E-Wallet)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Penyedia Gateway
                </label>
                <select
                  value={settings.payment.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, provider: e.target.value as any }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="SANDBOX">Sandbox Mode (Simulator Bawaan)</option>
                  <option value="MIDTRANS">Midtrans (Snap & Core API)</option>
                  <option value="XENDIT">Xendit</option>
                  <option value="TRIPAY">Tripay</option>
                  <option value="DUITKU">Duitku</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={settings.payment.merchantId}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, merchantId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Server Key (Secret Key)
                </label>
                <input
                  type="password"
                  value={settings.payment.serverKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, serverKey: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Client Key (Public Key)
                </label>
                <input
                  type="text"
                  value={settings.payment.clientKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, clientKey: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payment.isSandbox}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, isSandbox: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">Aktifkan Mode Sandbox (Testing / Uji Coba)</span>
              </label>
            </div>
          </div>
        )}

        {/* WHATSAPP API */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Integrasi WhatsApp Gateway API (Fonnte / Wablas)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  API Token / Secret Key
                </label>
                <input
                  type="password"
                  value={settings.whatsapp.apiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Pengirim (Device Number)
                </label>
                <input
                  type="text"
                  value={settings.whatsapp.senderNumber}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, senderNumber: e.target.value }
                  })}
                  placeholder="Kosongkan untuk otomatis pakai nomor WhatsApp toko"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Jika dikosongkan, otomatis menggunakan nomor WhatsApp toko.</p>
              </div>
            </div>
          </div>
        )}

        {/* TELEGRAM BOT */}
        {activeTab === 'telegram' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Notifikasi Telegram Admin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Token Telegram API
                </label>
                <input
                  type="password"
                  value={settings.telegram.botToken}
                  onChange={(e) => setSettings({
                    ...settings,
                    telegram: { ...settings.telegram, botToken: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chat ID / Channel ID
                </label>
                <input
                  type="text"
                  value={settings.telegram.chatId}
                  onChange={(e) => setSettings({
                    ...settings,
                    telegram: { ...settings.telegram, chatId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SMTP EMAIL */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Pengaturan SMTP Email Server
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={settings.email.host}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, host: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Port SMTP
                </label>
                <input
                  type="number"
                  value={settings.email.port}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, port: parseInt(e.target.value) || 587 }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TRACKING PIXEL */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Pelacakan Global (Pixel & GTM)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  value={settings.tracking.metaPixelId}
                  onChange={(e) => setSettings({
                    ...settings,
                    tracking: { ...settings.tracking, metaPixelId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Google Analytics Measurement ID
                </label>
                <input
                  type="text"
                  value={settings.tracking.googleAnalyticsId}
                  onChange={(e) => setSettings({
                    ...settings,
                    tracking: { ...settings.tracking, googleAnalyticsId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STORAGE S3 */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Penyimpanan Cloud Vault File Digital (AWS S3 / Wasabi)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={settings.storage.bucketName}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, bucketName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={settings.storage.region}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, region: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Konfigurasi Gateway</span>
          </button>
        </div>
      </form>
    </div>
  );
};
