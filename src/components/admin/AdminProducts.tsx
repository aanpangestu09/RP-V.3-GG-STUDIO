import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderDown, 
  FileText, 
  Upload, 
  Check, 
  X, 
  ExternalLink,
  Sparkles,
  Layers,
  Tag,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Product, ProductFile, ProductType } from '../../types/schema';
import { formatRupiah, formatBytes } from '../../lib/formatters';
import { api } from '../../lib/api';
import { ProductFormulirBuilder } from './ProductFormulirBuilder';

interface AdminProductsProps {
  onPreviewProduct: (slug: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onPreviewProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [filesList, setFilesList] = useState<ProductFile[]>([]);

  // Temp new file inputs
  const [newFileName, setNewFileName] = useState('');
  const [newFileSizeMB, setNewFileSizeMB] = useState('150');
  const [newFileType, setNewFileType] = useState('ZIP');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct({
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
      gallery: [],
      categoryId: 'cat_architecture',
      categoryName: 'Arsitektur & Konstruksi',
      regularPrice: 499000,
      discountPrice: 199000,
      productType: 'BUNDLE',
      status: 'ACTIVE',
      sku: 'RP-PROD-' + Math.floor(100 + Math.random() * 900),
      accessDurationDays: 0,
      downloadLimit: 10,
      orderBump: {
        id: 'bump_' + Date.now(),
        productId: '',
        bumpName: 'Tambahkan Bonus Eksklusif',
        bumpTagline: 'Tambahan library premium berharga diskon.',
        bumpPrice: 47000,
        isActive: true
      }
    });
    setFilesList([
      {
        id: 'file_1',
        productId: '',
        fileName: 'Master_Bundle_File.zip',
        fileSizeBytes: 1200000000,
        mimeType: 'application/zip',
        storagePath: 'vault/files/Master_Bundle_File.zip',
        fileType: 'ZIP',
        version: '1.0'
      }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFilesList(p.files || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFileToProduct = () => {
    if (!newFileName.trim()) return;
    const bytes = (parseFloat(newFileSizeMB) || 10) * 1024 * 1024;
    const fileObj: ProductFile = {
      id: 'file_' + Date.now(),
      productId: editingProduct?.id || '',
      fileName: newFileName.trim(),
      fileSizeBytes: bytes,
      mimeType: 'application/octet-stream',
      storagePath: `vault/files/${newFileName.trim()}`,
      fileType: newFileType,
      version: '1.0'
    };
    setFilesList([...filesList, fileObj]);
    setNewFileName('');
  };

  const handleRemoveFile = (fileId: string) => {
    setFilesList(filesList.filter(f => f.id !== fileId));
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const slug = productData.slug || productData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'produk-digital';
      const payload: Partial<Product> = {
        ...productData,
        slug,
        regularPrice: Number(productData.regularPrice) || 0,
        discountPrice: Number(productData.discountPrice) || 0,
      };

      if (productData.id && productData.id !== 'preview_prod') {
        await api.updateProduct(productData.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Save product error', err);
      throw err;
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Produk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola produk digital, file unduhan, dan formulir checkout.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#00875a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold hidden sm:inline-block">
          Total: {products.length} Produk Terdaftar
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Produk</th>
                <th className="py-3 px-6">Kategori</th>
                <th className="py-3 px-6">Tipe Produk</th>
                <th className="py-3 px-6">Harga Jual</th>
                <th className="py-3 px-6">File Digital</th>
                <th className="py-3 px-6">Order Bump</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.thumbnail}
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs block leading-snug">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          SKU: {prod.sku || '-'} • /{prod.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-medium">
                    {prod.categoryName}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded uppercase">
                      {prod.productType}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-bold text-slate-900 block">{formatRupiah(prod.discountPrice)}</span>
                    <span className="text-[10px] text-slate-400 line-through block">{formatRupiah(prod.regularPrice)}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>{prod.files?.length || 0} File</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    {prod.orderBump?.isActive ? (
                      <span className="text-emerald-700 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        +{formatRupiah(prod.orderBump.bumpPrice)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onPreviewProduct(prod.slug)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Lihat Landing Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Edit Produk"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRODUCT FORMULIR BUILDER (3-STEP SPLIT SCREEN BUILDER)   */}
      {/* ======================================================== */}
      {isModalOpen && editingProduct && (
        <ProductFormulirBuilder
          initialProduct={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
