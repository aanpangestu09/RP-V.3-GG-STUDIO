import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  CreditCard, 
  FolderDown, 
  Users, 
  Layers, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatRupiah } from '../../lib/formatters';

export const AdminAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading || !metrics) {
    return <div className="text-center py-20 text-slate-400">Memuat data analitik...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Analitik
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Performa omzet, konversi iklan UTM, dan metode pembayaran.
        </p>
      </div>

      {/* Attribution UTM Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UTM Channel Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Pendapatan Berdasarkan Channel (UTM Source)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Attribution ROAS</span>
          </div>

          <div className="space-y-4">
            {Object.entries(metrics.utmSources || {}).map(([source, data]: [string, any], idx) => {
              const percent = metrics.totalRevenue > 0 ? Math.round((data.revenue / metrics.totalRevenue) * 100) : 0;
              return (
                <div key={source} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="capitalize text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      {source} Ads / Campaign
                    </span>
                    <span className="text-slate-900">
                      {formatRupiah(data.revenue)} ({data.count} order • {percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Payment Methods Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Distribusi Metode Pembayaran Customer</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Verifikasi Gateway</span>
          </div>

          <div className="space-y-4">
            {Object.entries(metrics.paymentMethods || {}).map(([method, count]: [string, any]) => {
              const totalOrders = metrics.paidOrdersCount || 1;
              const percent = Math.round((count / totalOrders) * 100);
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{method}</span>
                    <span className="text-slate-900">{count} transaksi ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Digital Products */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <h3 className="font-extrabold text-base text-slate-900 mb-4">
          Produk Digital Terlaris (Best Seller)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama Produk Digital</th>
                <th className="py-3 px-4">Unit Terjual</th>
                <th className="py-3 px-4">Total Omset</th>
                <th className="py-3 px-4">Kontribusi Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.topProducts?.map((p: any, i: number) => {
                const percent = metrics.totalRevenue > 0 ? ((p.revenue / metrics.totalRevenue) * 100).toFixed(1) : '0';
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.count} Penjualan</td>
                    <td className="py-3 px-4 font-black text-blue-600">{formatRupiah(p.revenue)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
