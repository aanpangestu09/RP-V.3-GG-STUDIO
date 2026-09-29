import React from 'react';
import { 
  ShieldCheck, 
  Store, 
  LayoutDashboard, 
  Search, 
  Sparkles,
  Zap,
  ShoppingBag,
  Smartphone
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenLookup?: () => void;
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenLookup }) => {
  const { storeProfile, isMobileFrameView, toggleMobileFrameView } = useStoreSettings();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Dynamically uses the active store logo & name */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => onNavigate('storefront')}>
            <img
              src={storeProfile.logoUrl}
              alt={storeProfile.businessName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shadow-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 block leading-tight uppercase">
                  {storeProfile.businessName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Official
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block leading-none">
                Digital Commerce Platform
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => onNavigate('storefront')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'storefront' || currentView.startsWith('product-')
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              Katalog
            </button>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentView.startsWith('admin-')
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Toggle Mobile App Simulator Mode */}
            <button
              onClick={toggleMobileFrameView}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isMobileFrameView
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Alihkan ke tampilan Mobile App (Simulator)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isMobileFrameView ? 'Tampilan Web' : 'Mode Mobile App'}
              </span>
              <span className="sm:hidden">
                {isMobileFrameView ? 'Web' : 'App'}
              </span>
            </button>

            {onOpenLookup && (
              <button
                onClick={onOpenLookup}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Lacak pesanan dan unduh file Anda kembali"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Cek Order</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('admin-simulator')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              title="Uji coba webhook payment gateway & auto-delivery"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Simulator
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#00875a] hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
