import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  PlayCircle, 
  Gift, 
  X,
  Clock
} from 'lucide-react';
import { Order, UpsellOffer } from '../../types/schema';
import { formatRupiah } from '../../lib/formatters';
import { api } from '../../lib/api';

interface UpsellPageProps {
  order: Order;
  upsellOffer?: UpsellOffer;
  onComplete: (updatedOrder: Order) => void;
}

export const UpsellPage: React.FC<UpsellPageProps> = ({
  order,
  upsellOffer,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Fallback defaults
  const offer = upsellOffer || {
    id: 'upsell_default',
    triggerProductId: order.items[0]?.productId || '',
    offerProductId: 'prod_rab_mastery',
    title: 'PENAWARAN SPESIAL 1 KALI INI SAJA',
    subtitle: 'Tingkatkan Kemampuan Anda dengan Master Course RAB & AHSP Proyek Nyata 2026',
    specialPrice: 97000,
    regularPrice: 450000,
    headline: 'Hemat 78%! Dapatkan Video Course Lengkap & Template Kontrak Kerja',
    benefits: [
      '25 Video Tutorial HD: Step-by-Step Perhitungan RAB Rumah Tinggal & Ruko',
      'Format Surat Kontrak Kerja & Perjanjian Pemborong Berstandar Hukum',
      'Studi Kasus Menghitung Volume Pondasi, Beton Bertulang, & Rangka Baja',
      'Grup Komunitas Eksklusif & Tanya Jawab Langsung Bersama Arsitek Senior'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    isActive: true
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const updated = await api.acceptUpsell(order.id, {
        acceptUpsell: true,
        upsellTitle: offer.subtitle,
        upsellPrice: offer.specialPrice
      });
      onComplete(updated || order);
    } catch (err) {
      console.error(err);
      onComplete(order);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    onComplete(order);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl">
        {/* Urgent Alert Banner */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-4 border border-amber-400/30">
            <Clock className="w-3.5 h-3.5" />
            <span>TUNGGU! PESANAN ANDA SEDANG DISIAPKAN</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {offer.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {offer.headline}
          </p>
        </div>

        {/* Video / Preview Card */}
        <div className="mt-8 rounded-2xl overflow-hidden border border-slate-700 relative aspect-video bg-slate-950">
          <img
            src={offer.thumbnail}
            alt={offer.subtitle}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
            <h3 className="font-extrabold text-lg text-white">
              {offer.subtitle}
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                {formatRupiah(offer.specialPrice)}
              </span>
              <span className="text-sm text-slate-400 line-through">
                {formatRupiah(offer.regularPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Key benefits list */}
        <div className="mt-6 space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Materi Tambahan yang Akan Langsung Masuk ke Akun Anda:
          </h4>
          {offer.benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <span>Menambahkan ke Pesanan...</span>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>YA! TAMBAHKAN KE PESANAN SAYA ({formatRupiah(offer.specialPrice)})</span>
              </>
            )}
          </button>

          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="w-full py-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Tidak, terima kasih. Lewati dan langsung ke halaman akses produk saya →
          </button>
        </div>

        <p className="mt-6 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Akses materi langsung ditambahkan ke portal download yang sama.</span>
        </p>
      </div>
    </div>
  );
};
