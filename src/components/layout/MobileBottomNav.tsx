import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenLookup: () => void;
  onOpenSupport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenLookup,
  onOpenSupport
}) => {
  const { isAdminLoggedIn } = useStoreSettings();

  const isHome = currentView === 'storefront';
  const isCatalog = currentView === 'storefront' || currentView.startsWith('product-');
  const isOrders = currentView === 'download' || currentView === 'thank-you';
  const isAdmin = currentView.startsWith('admin-');

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-all duration-300"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {/* Tab 1: Beranda */}
        <button
          onClick={() => {
            onNavigate('storefront');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            isHome
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-transform ${isHome ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            {isHome && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Beranda</span>
        </button>

        {/* Tab 2: Katalog */}
        <button
          onClick={() => {
            onNavigate('storefront');
            setTimeout(() => {
              const el = document.getElementById('katalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentView === 'product-detail'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${currentView === 'product-detail' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            {currentView === 'product-detail' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Katalog</span>
        </button>

        {/* Tab 3: Cek Order */}
        <button
          onClick={onOpenLookup}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-500 hover:text-slate-800 transition-all rounded-xl active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Search className="w-5 h-5 stroke-2" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <span className="text-[10px] tracking-tight mt-1">Cek Order</span>
        </button>

        {/* Tab 4: Bantuan WhatsApp */}
        <button
          onClick={onOpenSupport}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-500 hover:text-slate-800 transition-all rounded-xl active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 stroke-2" />
          </div>
          <span className="text-[10px] tracking-tight mt-1">Bantuan</span>
        </button>

        {/* Tab 5: Admin */}
        <button
          onClick={() => {
            onNavigate('admin-dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            isAdmin
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 transition-transform ${isAdmin ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            {isAdmin && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Admin</span>
        </button>
      </div>
    </nav>
  );
};
