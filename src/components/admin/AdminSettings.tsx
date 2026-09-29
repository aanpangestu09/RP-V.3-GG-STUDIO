import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Upload, 
  Phone, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound, 
  ShieldCheck, 
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreContext';
import { api } from '../../lib/api';

const DEFAULT_SCALEV_LOGO = '/assets/default_store_logo.webp';

export const AdminSettings: React.FC = () => {
  const { storeProfile, adminUser, updateStoreProfile, refreshStoreProfile } = useStoreSettings();

  // ----------------------------------------------------
  // SECTION 1: PROFIL TOKO STATE
  // ----------------------------------------------------
  const [businessName, setBusinessName] = useState(storeProfile.businessName || '');
  const [logoPreview, setLogoPreview] = useState(storeProfile.logoUrl || DEFAULT_SCALEV_LOGO);
  const [supportWhatsapp, setSupportWhatsapp] = useState(storeProfile.supportWhatsapp || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when storeProfile loads or changes
  useEffect(() => {
    if (storeProfile) {
      setBusinessName(storeProfile.businessName);
      setLogoPreview(storeProfile.logoUrl || DEFAULT_SCALEV_LOGO);
      setSupportWhatsapp(storeProfile.supportWhatsapp);
    }
  }, [storeProfile]);

  // Handle Logo Upload via file reader (base64)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Format file harus berupa gambar (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('Ukuran file logo maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      setProfileErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Reset to default Scalev asset logo
  const handleResetToDefaultLogo = () => {
    setLogoPreview(DEFAULT_SCALEV_LOGO);
  };

  // Submit Section 1: Profil Toko
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    // Validasi: nama toko tidak boleh kosong
    if (!businessName.trim()) {
      setProfileErrorMsg('Nama Toko wajib diisi.');
      return;
    }

    // Validasi: nomor WA harus format angka valid
    const cleanWa = supportWhatsapp.trim().replace(/[\s-]/g, '');
    if (!cleanWa) {
      setProfileErrorMsg('Nomor WhatsApp Toko wajib diisi.');
      return;
    }

    const waRegex = /^\+?[0-9]{9,16}$/;
    if (!waRegex.test(cleanWa)) {
      setProfileErrorMsg('Nomor WhatsApp harus berformat angka valid (contoh: 628123456789).');
      return;
    }

    setIsSavingProfile(true);
    try {
      let finalLogoUrl = logoPreview;

      // If user uploaded a new base64 dataUrl, persist via server upload endpoint
      if (logoPreview.startsWith('data:image/')) {
        const uploadRes = await api.uploadLogo(logoPreview);
        if (uploadRes.success && uploadRes.url) {
          finalLogoUrl = uploadRes.url;
        }
      }

      const res = await updateStoreProfile({
        businessName: businessName.trim(),
        logoUrl: finalLogoUrl,
        supportWhatsapp: cleanWa,
      });

      if (res.success) {
        setProfileSuccessMsg('Perubahan profil toko berhasil disimpan!');
        refreshStoreProfile();
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg(res.message || 'Gagal menyimpan profil toko.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err?.message || 'Terjadi kesalahan server saat menyimpan.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // SECTION 2: AKUN ADMIN STATE
  // ----------------------------------------------------
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Submit Section 2: Akun Admin Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    // Validasi input
    if (!oldPassword) {
      setPasswordErrorMsg('Password lama wajib diisi untuk verifikasi.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordErrorMsg('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi password tidak sama dengan password baru.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.changeAdminPassword({
        oldPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordSuccessMsg('Password admin berhasil diubah!');
        // Kosongkan kembali semua field password setelah berhasil
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 4000);
      } else {
        setPasswordErrorMsg(res.message || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err?.message || 'Terjadi kesalahan sistem saat verifikasi password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola profil toko, identitas brand, nomor kontak WhatsApp, dan keamanan akun admin Anda.
        </p>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: PROFIL TOKO                                   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              PROFIL TOKO
            </h2>
            <p className="text-xs text-slate-500">
              Identitas brand, nama resmi toko, logo aktif, dan nomor WhatsApp kontak.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {profileSuccessMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Field 1: Nama Toko */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Toko <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Ruang Proyek"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nama toko akan tampil pada navbar, footer, checkout, serta subjek email customer.
            </p>
          </div>

          {/* Field 2: Logo Toko */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Logo Toko
            </label>

            {/* Active Logo Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={logoPreview}
                  alt="Preview Logo Toko"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-white p-1 shadow-sm"
                  onError={(e) => {
                    // Fallback to default
                    (e.target as HTMLImageElement).src = DEFAULT_SCALEV_LOGO;
                  }}
                />
                <span className="absolute -bottom-2 -right-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                  Aktif
                </span>
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Pratinjau Logo yang Sedang Aktif
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Logo ini otomatis digunakan di: navbar landing page, halaman login, sidebar dashboard, dan header email customer.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                    title="Gunakan logo standar bawaan"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gunakan Logo Standar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Field 3: Nomor WhatsApp Toko */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp Toko <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                placeholder="628123456789"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Format: Angka dengan kode negara (contoh: <code>628123456789</code>). Dipakai sebagai nomor kontak di footer landing page dan nomor pengirim default untuk follow-up WA.
            </p>
          </div>

          {/* Tombol Simpan Perubahan Profil Toko */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: AKUN ADMIN (UBAH PASSWORD)                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              AKUN ADMIN
            </h2>
            <p className="text-xs text-slate-500">
              Ubah kata sandi akun administrator untuk menjaga keamanan sistem.
            </p>
          </div>
        </div>

        {/* Read-only Admin Account Info */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block uppercase">
              Akun Administrator Terdaftar
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {adminUser?.email || 'aanpangestu09@gmail.com'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Role: {adminUser?.role || 'Super Administrator'} (Akses Penuh)
            </span>
          </div>
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
            Email Tetap
          </span>
        </div>

        {/* Password Notifications */}
        {passwordSuccessMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        {/* Form Ubah Password (Independen) */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password Lama <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama Anda saat ini"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Verifikasi kecocokan dengan password yang tersimpan saat ini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru yang sama"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tombol Ubah Password (Tombol Hijau Aksen) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isChangingPassword ? 'Memverifikasi...' : 'Ubah Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
