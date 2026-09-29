import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShoppingBag, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { Customer } from '../../types/schema';
import { formatRupiah, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           c.phone.includes(q) ||
           (c.company && c.company.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pembeli terdaftar, riwayat transaksi, dan kontak WhatsApp.
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
          Total: {customers.length} Customer
        </span>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Pelanggan</th>
                <th className="py-3 px-6">Kontak WhatsApp & Email</th>
                <th className="py-3 px-6">Perusahaan</th>
                <th className="py-3 px-6">Total Pesanan</th>
                <th className="py-3 px-6">Total Belanja (LTV)</th>
                <th className="py-3 px-6">Order Terakhir</th>
                <th className="py-3 px-6 text-right">Hubungi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {cust.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {cust.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-slate-800 font-medium block">{cust.phone}</span>
                    <span className="text-[11px] text-slate-400 block">{cust.email}</span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-600">
                    {cust.company || '-'}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {cust.totalOrders} Order
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-black text-slate-900">
                    {formatRupiah(cust.totalSpent)}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {formatDate(cust.lastOrderAt)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <a
                      href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(cust.name)},%20terima%20kasih%20telah%20berbelanja%20di%20Ruang%20Proyek`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
