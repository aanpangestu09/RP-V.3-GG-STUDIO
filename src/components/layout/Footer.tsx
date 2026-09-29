import React from 'react';
import { ShieldCheck, Lock, Headphones, RefreshCw, Zap } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { storeProfile } = useStoreSettings();
  const cleanWa = storeProfile.supportWhatsapp.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Pengiriman Instan 100%</p>
              <p className="text-xs text-slate-400">File langsung terkirim detik ini juga</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">QRIS & VA Terverifikasi</p>
              <p className="text-xs text-slate-400">Enkripsi SHA256 & Payment Webhook</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Tautan Akses Privat</p>
              <p className="text-xs text-slate-400">Akses aman dengan token terenkripsi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Bantuan WhatsApp Siaga</p>
              <p className="text-xs text-slate-400">Hubungi {storeProfile.supportWhatsapp}</p>
            </div>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm uppercase">{storeProfile.businessName}</span>
            <span>&copy; {new Date().getFullYear()} {storeProfile.businessName}. Hak Cipta Dilindungi.</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <span className="hover:text-slate-400 cursor-pointer">Ketentuan Layanan</span>
            <span className="hover:text-slate-400 cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-slate-400 cursor-pointer">Lisensi Digital</span>
            <a 
              href={`https://wa.me/${cleanWa}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              Bantuan WhatsApp: {storeProfile.supportWhatsapp}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
