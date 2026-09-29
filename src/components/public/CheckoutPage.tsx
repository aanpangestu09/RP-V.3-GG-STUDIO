import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Product } from '../../types/schema';
import { FormCOCheckout } from './FormCOCheckout';

interface CheckoutPageProps {
  product: Product;
  onPaymentCreated: (orderId: string, paymentDetails: any) => void;
  onBack: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  product,
  onPaymentCreated,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-slate-100/60 py-6 sm:py-10">
      <div className="max-w-xl mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Deskripsi Produk</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">256-bit Secure Checkout</span>
        </div>
      </div>

      <FormCOCheckout
        product={product}
        onPaymentCreated={onPaymentCreated}
        onBack={onBack}
      />
    </div>
  );
};
