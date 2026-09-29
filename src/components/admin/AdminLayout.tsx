import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Tag, 
  BarChart3, 
  Bell, 
  Settings, 
  FileText, 
  Zap, 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink,
  Menu,
  X,
  Clock,
  Sparkles,
  LogOut,
  CreditCard,
  MessageSquare,
  Target
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  onLogout,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { storeProfile, adminUser, logoutAdmin, sourceMode, setSourceMode, toggleSourceMode } = useStoreSettings();

  // If in live mode and currently on simulator tab, redirect to dashboard
  React.useEffect(() => {
    if (sourceMode === 'live' && currentTab === 'simulator') {
      onSelectTab('dashboard');
    }
  }, [sourceMode, currentTab, onSelectTab]);

  const rawMenuSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'TRANSAKSI',
      items: [
        { id: 'orders', label: 'Order', icon: ShoppingBag },
        { id: 'products', label: 'Produk', icon: Package },
        { id: 'customers', label: 'Pelanggan', icon: Users },
        { id: 'abandoned', label: 'Abandoned', icon: Clock }
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { id: 'marketing', label: 'Promo', icon: Tag },
        { id: 'whatsapp-followup', label: 'WhatsApp', icon: MessageSquare, badge: 'AUTO' },
        { id: 'tracking-pixel', label: 'Pixel', icon: Target, badge: 'PIXEL' },
        { id: 'analytics', label: 'Analitik', icon: BarChart3 }
      ]
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'gateway', label: 'Gateway', icon: CreditCard },
        // Menu Simulator hanya tampil di Mode Test
        ...(sourceMode === 'test' ? [{ id: 'simulator', label: 'Simulator', icon: Zap, badge: 'TEST' }] : []),
        { id: 'notifications', label: 'Notifikasi', icon: Bell },
        { id: 'audit-logs', label: 'Audit Log', icon: ShieldCheck },
        { id: 'settings', label: 'Pengaturan', icon: Settings }
      ]
    }
  ];

  const menuSections = rawMenuSections;

  const handleLogout = () => {
    logoutAdmin();
    if (onLogout) {
      onLogout();
    } else {
      onExitAdmin();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row text-slate-800 font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img
            src={storeProfile.logoUrl}
            alt={storeProfile.businessName}
            className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 border border-slate-200 shadow-2xs shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
            }}
          />
          <span className="font-extrabold text-sm tracking-tight truncate max-w-[130px] uppercase text-slate-900">
            {storeProfile.businessName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Mode Toggle */}
          <button
            onClick={toggleSourceMode}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all border ${
              sourceMode === 'test'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sourceMode === 'test' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{sourceMode === 'test' ? 'TEST' : 'LIVE'}</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation (Seamless & blended with page background) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#f8fafc]/95 lg:bg-[#f8fafc] backdrop-blur-md text-slate-700 border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Logo & Platform Name */}
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={storeProfile.logoUrl}
                alt={storeProfile.businessName}
                className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shadow-2xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/default_store_logo.webp';
                }}
              />
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight block truncate uppercase">
                  {storeProfile.businessName}
                </span>
                <span className="text-[10px] text-[#00875a] font-bold block uppercase tracking-wider">
                  Admin Dashboard
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#00875a] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User profile & exit to public store + Logout button */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-100/40 space-y-2.5 shrink-0">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#00875a] flex items-center justify-center text-xs font-bold text-white uppercase shadow-2xs shrink-0">
              {adminUser?.name ? adminUser.name.slice(0, 2) : 'AP'}
            </div>
            <div className="overflow-hidden min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">
                {adminUser?.name || 'Aan Pangestu'}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium truncate">
                {adminUser?.email || 'aanpangestu09@gmail.com'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onExitAdmin}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Lihat Toko Publik"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Toko</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
              title="Keluar dari sesi Admin"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f8fafc]">
        {/* Top breadcrumb & quick actions bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="font-bold text-slate-900 capitalize">
              {currentTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Test / Live Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSourceMode('test')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceMode === 'test'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Aktifkan Mode Test (Hanya menampilkan data simulasi)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mode Test</span>
              </button>

              <button
                onClick={() => setSourceMode('live')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceMode === 'live'
                    ? 'bg-[#00875a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Aktifkan Mode Live (Hanya menampilkan data transaksi riil)"
              >
                <span className={`w-2 h-2 rounded-full ${sourceMode === 'live' ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                <span>Mode Live</span>
              </button>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#00875a] bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-[#00875a] animate-pulse"></span>
              Sistem Aktif (Standby)
            </span>
          </div>
        </div>

        {/* View container */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
