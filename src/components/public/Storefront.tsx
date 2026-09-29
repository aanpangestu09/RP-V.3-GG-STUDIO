import React, { useState } from 'react';
import { 
  FolderDown, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive,
  Search,
  CheckCircle2,
  Clock,
  Compass,
  Building2,
  TrendingUp,
  Palette,
  Zap,
  Tag
} from 'lucide-react';
import { Product } from '../../types/schema';
import { formatRupiah } from '../../lib/formatters';

interface StorefrontProps {
  products: Product[];
  onSelectProduct: (slug: string) => void;
  onDirectCheckout: (slug: string) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  onSelectProduct,
  onDirectCheckout
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'ALL', label: 'Semua Produk', icon: Compass },
    { id: 'cat_architecture', label: 'Arsitektur & Konstruksi', icon: Building2 },
    { id: 'cat_finance', label: 'Bisnis & Finansial', icon: TrendingUp },
    { id: 'cat_design', label: 'Desain & UI/UX', icon: Palette }
  ];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-16">
      {/* ======================================================== */}
      {/* MOBILE APP HEADER & QUICK STORIES (Shown on mobile)      */}
      {/* ======================================================== */}
      <div className="block md:hidden bg-slate-900 text-white pt-4 pb-5 px-4 shadow-lg border-b border-slate-800">
        {/* Mobile Search input */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari template AutoCAD, RAB Excel, aset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Mobile Promo Banner Card */}
        <div className="p-3 bg-gradient-to-r from-blue-900/90 to-emerald-900/90 border border-blue-700/50 rounded-2xl flex items-center justify-between gap-3 shadow-md mb-3.5">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              <span>Pengiriman Instan Otomatis</span>
            </div>
            <p className="text-xs font-black text-white mt-0.5 leading-snug">
              Bayar QRIS / VA langsung download detik ini juga!
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-xl shadow-sm">
            24/7 LIVE
          </span>
        </div>

        {/* Mobile Category Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.id === 'ALL' ? 'Semua' : cat.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP HERO SHOWCASE (Shown on tablet & desktop)        */}
      {/* ======================================================== */}
      <section className="hidden md:block relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white py-16 lg:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs sm:text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Platform Penjualan Aset & Produk Digital Mandiri #1</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Aset Digital Profesional Siap Pakai Untuk Mempercepat Proyek Anda
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Template AutoCAD, 3D SketchUp, Master RAB Excel SNI, Design System, dan file kerja profesional. Sekali bayar, akses selamanya, langsung download detik ini juga.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pengiriman Otomatis via Email & WA
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pembayaran QRIS & Virtual Account
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lisensi Komersial Seumur Hidup
            </span>
          </div>
        </div>
      </section>

      {/* Desktop Filter and Search Bar */}
      <div id="katalog-section" className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-xl shadow-slate-200/60 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari template atau aset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRODUCT GRID (2-Columns on Mobile, 3 on Desktop)         */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-12">
        {/* Section title on mobile */}
        <div className="flex items-center justify-between mb-3 md:hidden">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            {selectedCategory === 'ALL' ? 'Daftar Produk Digital' : categories.find(c => c.id === selectedCategory)?.label}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {filteredProducts.length} Produk
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">Tidak ada produk yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {filteredProducts.map((product) => {
              const discountPercent = Math.round(
                ((product.regularPrice - product.discountPrice) / product.regularPrice) * 100
              );

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative"
                >
                  {/* Thumbnail Image */}
                  <div 
                    onClick={() => onSelectProduct(product.slug)}
                    className="relative aspect-[4/3] sm:aspect-video overflow-hidden bg-slate-100 cursor-pointer"
                  >
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discountPercent > 0 && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-600 text-white text-[9px] sm:text-xs font-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-md">
                        -{discountPercent}%
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-slate-900/80 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-semibold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md flex items-center gap-1">
                      <FolderDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                      <span>{product.files?.length || 1} File</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Quiet unboxed metadata */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2">
                        <span className="font-bold text-emerald-700 uppercase tracking-wider truncate max-w-[90px] sm:max-w-none">
                          {product.categoryName}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <h3
                        onClick={() => onSelectProduct(product.slug)}
                        className="font-bold text-xs sm:text-base text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-slate-600 line-clamp-2 leading-relaxed hidden sm:block">
                        {product.shortDescription}
                      </p>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                      <div>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through block">
                          {formatRupiah(product.regularPrice)}
                        </span>
                        <span className="text-sm sm:text-xl font-black text-slate-900 block leading-tight">
                          {formatRupiah(product.discountPrice)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectProduct(product.slug)}
                          className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onDirectCheckout(product.slug)}
                          className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-[#00875a] hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Beli</span>
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
