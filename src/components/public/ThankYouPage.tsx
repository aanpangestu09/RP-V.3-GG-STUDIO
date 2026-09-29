import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Download, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  FolderDown,
  Key,
  ShoppingBag
} from 'lucide-react';
import { Order, Product } from '../../types/schema';
import { formatRupiah } from '../../lib/formatters';
import { fireTrackingEvent } from '../../lib/tracking';
import { useStoreSettings } from '../../context/StoreContext';

interface ThankYouPageProps {
  order: Order;
  recommendedProducts?: Product[];
  onGoToDownload: (token: string) => void;
  onSelectProduct: (slug: string) => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  order,
  recommendedProducts = [],
  onGoToDownload,
  onSelectProduct
}) => {
  const { storeProfile } = useStoreSettings();

  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore in headless environments
    }

    // Fire conversion tracking silently in background
    const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
    fireTrackingEvent({
      eventName: 'Purchase',
      orderId: order.orderNumber,
      value: order.totalAmount,
      currency: 'IDR',
      productName: mainItem?.productName,
      productId: mainItem?.productId,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone
    });
  }, [order.id]);

  const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
  const bumpItems = order.items.filter(i => i.itemType === 'BUMP');
  const cleanWhatsapp = (storeProfile.supportWhatsapp || '6281234567890').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00875a] flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-[#00875a] font-bold text-xs uppercase tracking-wider mb-2 border border-emerald-200/60">
            ✓ Pembayaran Berhasil Dikonfirmasi
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            Terima Kasih, {order.customerName}!
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Pesanan <strong className="text-slate-900 font-mono font-bold">{order.orderNumber}</strong> telah lunas dan file digital Anda siap diunduh sekarang.
          </p>

          {/* PRIMARY DOWNLOAD / ACCESS CTA */}
          <div className="mt-6">
            <button
              onClick={() => onGoToDownload(order.downloadToken || '')}
              className="w-full py-4 bg-[#00875a] hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base sm:text-lg rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>DOWNLOAD & AKSES PRODUK SEKARANG</span>
            </button>
          </div>

          {/* Order Summary Snapshot */}
          <div className="mt-6 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Nomor Pesanan:</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-slate-500">Produk Utama:</span>
              <span className="font-bold text-slate-900 text-right max-w-[240px] truncate">{mainItem?.productName}</span>
            </div>

            {/* Bump products list */}
            {bumpItems.length > 0 ? (
              bumpItems.map((bump) => (
                <div key={bump.id} className="flex justify-between items-center text-emerald-800 bg-emerald-50/70 px-2.5 py-1.5 rounded-lg border border-emerald-200/50">
                  <span className="font-semibold text-xs">+ Tambahan: {bump.productName}</span>
                  <span className="font-bold text-xs text-emerald-900">{formatRupiah(bump.price)}</span>
                </div>
              ))
            ) : order.orderBumpAdded ? (
              <div className="flex justify-between items-center text-emerald-700">
                <span>Bonus Tambahan:</span>
                <span className="font-semibold">Termasuk di dalam paket</span>
              </div>
            ) : null}

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Metode Pembayaran:</span>
              <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status Pembayaran:</span>
              <span className="font-bold text-[#00875a]">LUNAS (Verified)</span>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
              <span className="text-slate-600 font-bold">Total Pembayaran:</span>
              <span className="text-base font-black text-slate-900">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>

          {/* License Key if exists */}
          {order.licenseKey && (
            <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> License Key Produk:
                </span>
                <span className="text-sm font-mono font-black text-slate-900 mt-1 block">
                  {order.licenseKey}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(order.licenseKey || '')}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Salin Key
              </button>
            </div>
          )}

          {/* Delivery Notice Note */}
          <div className="mt-5 p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Link unduhan cadangan telah otomatis dikirimkan ke <strong>{order.customerEmail}</strong> dan WhatsApp <strong>{order.customerPhone}</strong>.
            </span>
          </div>

          {/* WhatsApp Support Link */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Halo%20Admin,%20saya%20sudah%20menyelesaikan%20pembayaran%20untuk%20pesanan%20${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Butuh Bantuan? Hubungi WhatsApp Layanan Pelanggan</span>
            </a>
          </div>
        </div>

        {/* Optional Recommendations */}
        {recommendedProducts.length > 0 && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Produk Lainnya di Katalog
              </h3>
              <button
                type="button"
                onClick={() => onSelectProduct(recommendedProducts[0].slug)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {recommendedProducts.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p.slug)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all flex gap-3 cursor-pointer items-center"
                >
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate block">
                      {p.categoryName}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                      {p.name}
                    </h4>
                    <span className="text-xs font-black text-[#00875a] mt-1 block">
                      {formatRupiah(p.discountPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
