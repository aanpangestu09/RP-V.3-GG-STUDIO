import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

interface FunnelHeaderProps {
  title?: string;
  onBackToHome?: () => void;
}

export const FunnelHeader: React.FC<FunnelHeaderProps> = ({ title, onBackToHome }) => {
  const { storeProfile } = useStoreSettings();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={onBackToHome}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
        >
          <img
            src={storeProfile.logoUrl}
            alt={storeProfile.businessName}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
            }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-tight block leading-tight">
                {storeProfile.businessName}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                Official
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">
              {title || 'Transaksi Digital Aman'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/80 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] sm:text-xs">256-Bit SSL Secured</span>
        </div>
      </div>
    </header>
  );
};
