import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  RotateCcw, 
  Wifi, 
  BatteryMedium, 
  Signal, 
  ChevronLeft,
  X,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

interface MobileAppSimulatorProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const MobileAppSimulator: React.FC<MobileAppSimulatorProps> = ({
  children,
  onExit
}) => {
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'android'>('iphone');
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // Keep simulated time updated
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-6 px-4 selection:bg-emerald-600 selection:text-white">
      {/* Top Simulator Control Bar */}
      <header className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white">
                Tampilan Mobile App
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Interactive Preview
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Simulasi tampilan responsif smartphone dengan navigasi mobile bawah dan checkout cepat
            </p>
          </div>
        </div>

        {/* Device selector and Exit button */}
        <div className="flex items-center gap-2">
          {/* Device model toggle */}
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs font-semibold">
            <button
              onClick={() => setDeviceModel('iphone')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                deviceModel === 'iphone'
                  ? 'bg-slate-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              iPhone 16 Pro
            </button>
            <button
              onClick={() => setDeviceModel('android')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                deviceModel === 'android'
                  ? 'bg-slate-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pixel / Galaxy
            </button>
          </div>

          {/* Exit / Switch to Full Web */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            title="Kembali ke tampilan web desktop penuh"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tampilan Web Penuh</span>
            <span className="sm:hidden">Web</span>
          </button>
        </div>
      </header>

      {/* Smartphone Chassis Container */}
      <div className="relative">
        {/* Exterior metallic ring / bezel */}
        <div 
          className={`relative rounded-[52px] p-[12px] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)] transition-all duration-300 ${
            deviceModel === 'iphone'
              ? 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600/60'
              : 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-2 border-zinc-600/60 rounded-[44px]'
          }`}
          style={{
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '830px',
            maxHeight: 'calc(100vh - 140px)',
          }}
        >
          {/* Hardware buttons accents (volume, power) */}
          <div className="absolute -left-[14px] top-28 w-[3px] h-8 bg-slate-600 rounded-l-md" />
          <div className="absolute -left-[14px] top-40 w-[3px] h-12 bg-slate-600 rounded-l-md" />
          <div className="absolute -left-[14px] top-56 w-[3px] h-12 bg-slate-600 rounded-l-md" />
          <div className="absolute -right-[14px] top-36 w-[3px] h-16 bg-slate-600 rounded-r-md" />

          {/* Screen Bezel inner frame */}
          <div className="relative w-full h-full bg-slate-900 rounded-[40px] overflow-hidden flex flex-col border border-black/40 shadow-inner">
            
            {/* Top Native Phone Status Bar */}
            <div className="h-10 bg-white/95 text-slate-900 px-7 flex items-center justify-between text-xs font-bold select-none shrink-0 z-50 border-b border-slate-100">
              {/* Clock */}
              <span className="tracking-tight text-[13px]">{currentTime}</span>

              {/* Dynamic Island (iPhone) or Punch-hole camera (Android) */}
              {deviceModel === 'iphone' ? (
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-blue-950/80" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto" />
              )}

              {/* System icons (Signal, Wifi, Battery) */}
              <div className="flex items-center gap-1.5 text-slate-800">
                <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
                <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
                <div className="w-5 h-2.5 border border-slate-700 rounded-sm p-0.5 flex items-center">
                  <div className="h-full w-full bg-emerald-600 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Mobile App Screen Content (Scrollable Viewport) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-900 relative scrollbar-thin scrollbar-thumb-slate-300">
              {children}
            </div>

            {/* Native Bottom Home Gesture Indicator */}
            <div className="h-5 bg-white/95 flex items-center justify-center shrink-0 z-50">
              <div className="w-32 h-1 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Footer note */}
      <footer className="mt-4 text-center text-xs text-slate-500 flex items-center gap-2">
        <Info className="w-3.5 h-3.5" />
        <span>Tampilan aplikasi ini juga otomatis menyesuaikan secara native bila dibuka di smartphone Anda.</span>
      </footer>
    </div>
  );
};
