import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Star, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Zap, 
  FolderSync, 
  HelpCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Lock,
  Headphones,
  Check
} from 'lucide-react';
import { Product } from '../../types/schema';
import { formatRupiah, formatBytes } from '../../lib/formatters';

interface ProductLandingPageProps {
  product: Product;
  onProceedToCheckout: (slug: string) => void;
}

export const ProductLandingPage: React.FC<ProductLandingPageProps> = ({
  product,
  onProceedToCheckout
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const cfg = product.landingConfig;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const discountPercent = Math.round(
    ((product.regularPrice - product.discountPrice) / product.regularPrice) * 100
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          {cfg?.hero.badge && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs sm:text-sm font-bold mb-6">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{cfg.hero.badge}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            {cfg?.hero.headline || product.name}
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {cfg?.hero.subheadline || product.shortDescription}
          </p>

          {/* Social rating pill */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-300">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="font-bold text-white">4.9 / 5.0</span>
            <span className="text-slate-400">(3.840+ Arsitek & Kontraktor Telah Mengunduh)</span>
          </div>

          {/* Product Cover Preview & Pricing Card */}
          <div className="mt-12 max-w-3xl mx-auto bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-700/80 shadow-2xl">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950">
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-xs text-red-400 font-bold line-through block">
                    Harga Normal {formatRupiah(product.regularPrice)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {formatRupiah(product.discountPrice)}
                    </span>
                    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded">
                      HEMAT {discountPercent}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onProceedToCheckout(product.slug)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-base rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>{cfg?.hero.ctaText || 'Beli & Download Sekarang'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pembayaran Aman Terenkripsi via QRIS & Virtual Account. Akses File Instan Otomatis.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      {cfg?.problem && (
        <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {cfg.problem.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                {cfg.problem.description}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cfg.problem.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5"
                >
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. SOLUTION SECTION */}
      {cfg?.solution && (
        <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                SOLUSI TERBAIK
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {cfg.solution.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                {cfg.solution.description}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cfg.solution.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-emerald-200/90 shadow-sm flex items-start gap-3.5"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. PRODUCT BENEFITS */}
      {cfg?.benefits && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {cfg.benefits.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cfg.benefits.items.map((b, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. WHAT'S INCLUDED (FILES LIST) */}
      <section className="py-16 lg:py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">
              PAKET LENGKAP SEKALI BAYAR
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black">
              Rincian Seluruh File Digital yang Akan Anda Dapatkan
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Semua file dikemas rapi dan dapat diunduh per file atau seluruhnya sekaligus.
            </p>
          </div>

          <div className="space-y-4">
            {product.files && product.files.map((file, idx) => (
              <div
                key={file.id}
                className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                        {file.fileType}
                      </span>
                      <span className="text-xs text-slate-400">
                        • v{file.version || '1.0'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {file.fileName}
                    </h3>
                    {file.accessInstructions && (
                      <p className="text-xs text-slate-400 mt-1">
                        {file.accessInstructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg">
                    {formatBytes(file.fileSizeBytes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF / TESTIMONIALS */}
      {cfg?.testimonials && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Apa Kata Mereka yang Telah Menggunakan Produk Ini?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cfg.testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex text-amber-400 mb-3">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                      "{t.content}"
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. FAQ ACCORDION */}
      {cfg?.faqs && (
        <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
            </div>

            <div className="space-y-3">
              {cfg.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-sm sm:text-base">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 8. PRICING & FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-b from-blue-900 to-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-blue-400 font-bold text-xs uppercase tracking-widest block mb-2">
            PENAWARAN TERBATAS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Dapatkan {product.name} Hari Ini
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base">
            Jangan buang waktu membuat aset dari nol. Investasi sekali untuk mempercepat seluruh proyek Anda sekarang juga.
          </p>

          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 inline-block w-full max-w-lg">
            <span className="text-slate-400 line-through text-sm block">
              Harga Asli: {formatRupiah(product.regularPrice)}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              {formatRupiah(product.discountPrice)}
            </div>
            <p className="text-xs text-blue-300 mt-1">
              Sekali bayar • Tanpa biaya langganan • Lisensi Komersial
            </p>

            <button
              onClick={() => onProceedToCheckout(product.slug)}
              className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-lg rounded-xl shadow-xl shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Beli Sekarang & Download File</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar on Mobile */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 line-through">
              {formatRupiah(product.regularPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-[9px] font-black bg-red-100 text-red-700 px-1 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>
          <span className="text-base font-black text-slate-900 block leading-tight">
            {formatRupiah(product.discountPrice)}
          </span>
        </div>
        <button
          onClick={() => onProceedToCheckout(product.slug)}
          className="flex-1 max-w-[200px] py-2.5 px-4 bg-[#00875a] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-white text-white" />
          <span>Checkout Sekarang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
