import React from 'react';
import { 
  X, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  Download, 
  CreditCard, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

interface MobileQuickSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLookup?: () => void;
}

export const MobileQuickSupportModal: React.FC<MobileQuickSupportModalProps> = ({
  isOpen,
  onClose,
  onOpenLookup
}) => {
  const { storeProfile } = useStoreSettings();

  if (!isOpen) return null;

  const cleanWa = storeProfile.supportWhatsapp.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo Admin ${storeProfile.businessName}, saya ingin bertanya tentang produk dan pesanan saya.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                Pusat Bantuan & WhatsApp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tim Siaga {storeProfile.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Direct WhatsApp Callout */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-900">
              Butuh panduan download, kendala pembayaran, atau konfirmasi pesanan?
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat WhatsApp Langsung</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
            <span className="text-[11px] text-emerald-700 mt-2 block font-medium">
              Nomor CS: +{cleanWa}
            </span>
          </div>

          {/* Quick FAQ / Self-service */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Bantuan Mandiri Cepat
            </h4>

            {onOpenLookup && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLookup();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cek Status Pesanan & Download File</p>
                    <p className="text-[11px] text-slate-500">Cukup masukkan nomor WA atau ID pesanan Anda</p>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-bold">Buka</span>
              </button>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Pengiriman File 24/7 Otomatis</p>
                <p className="text-[11px] text-slate-500">
                  Setelah scan QRIS / VA berhasil, sistem langsung mengirimkan link download ke WhatsApp & email dalam 1 detik.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Lisensi Komersial Seumur Hidup</p>
                <p className="text-[11px] text-slate-500">
                  File bebas diedit dan digunakan untuk proyek klien Anda tanpa biaya berlangganan tambahan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
