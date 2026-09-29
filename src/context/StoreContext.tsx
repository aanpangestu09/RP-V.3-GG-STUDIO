import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface StoreProfile {
  businessName: string;
  logoUrl: string;
  supportWhatsapp: string;
}

interface AdminUserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StoreContextType {
  storeProfile: StoreProfile;
  adminUser: AdminUserInfo | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  refreshStoreProfile: () => Promise<void>;
  updateStoreProfile: (payload: { businessName: string; logoUrl?: string; supportWhatsapp: string }) => Promise<{ success: boolean; message?: string }>;
  loginAdmin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isPrivacyHidden: boolean;
  togglePrivacy: () => void;
  isMobileFrameView: boolean;
  setIsMobileFrameView: (val: boolean) => void;
  toggleMobileFrameView: () => void;
  sourceMode: 'test' | 'live';
  setSourceMode: (mode: 'test' | 'live') => void;
  toggleSourceMode: () => void;
}

const DEFAULT_STORE_PROFILE: StoreProfile = {
  businessName: 'Ruang Proyek',
  logoUrl: '/assets/default_store_logo.webp',
  supportWhatsapp: '6281234567890',
};

const StoreContext = createContext<StoreContextType>({
  storeProfile: DEFAULT_STORE_PROFILE,
  adminUser: null,
  isAdminLoggedIn: true, // Default to true so existing admin routes continue working
  isLoading: false,
  refreshStoreProfile: async () => {},
  updateStoreProfile: async () => ({ success: false }),
  loginAdmin: async () => ({ success: false }),
  logoutAdmin: () => {},
  isLoginModalOpen: false,
  setIsLoginModalOpen: () => {},
  isPrivacyHidden: false,
  togglePrivacy: () => {},
  isMobileFrameView: false,
  setIsMobileFrameView: () => {},
  toggleMobileFrameView: () => {},
  sourceMode: 'test',
  setSourceMode: () => {},
  toggleSourceMode: () => {},
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>({
    id: 'admin_1',
    name: 'Aan Pangestu',
    email: 'aanpangestu09@gmail.com',
    role: 'Super Administrator'
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('rp_admin_logged_in') !== 'false';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPrivacyHidden, setIsPrivacyHidden] = useState<boolean>(false);
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(false);
  const [sourceMode, setSourceModeState] = useState<'test' | 'live'>(() => {
    const saved = localStorage.getItem('rp_source_mode');
    return saved === 'live' ? 'live' : 'test';
  });

  const setSourceMode = (mode: 'test' | 'live') => {
    setSourceModeState(mode);
    localStorage.setItem('rp_source_mode', mode);
  };

  const toggleSourceMode = () => {
    const nextMode = sourceMode === 'test' ? 'live' : 'test';
    setSourceMode(nextMode);
  };

  const toggleMobileFrameView = () => {
    setIsMobileFrameView(prev => !prev);
  };

  const togglePrivacy = () => {
    setIsPrivacyHidden(prev => !prev);
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getSettings();
      if (data?.general) {
        setStoreProfile({
          businessName: data.general.businessName || DEFAULT_STORE_PROFILE.businessName,
          logoUrl: data.general.logoUrl || DEFAULT_STORE_PROFILE.logoUrl,
          supportWhatsapp: data.general.supportWhatsapp || DEFAULT_STORE_PROFILE.supportWhatsapp,
        });
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    }
  };

  const fetchAdmin = async () => {
    try {
      const res = await api.getAdminProfile();
      if (res?.success && res.data) {
        setAdminUser(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAdmin();
  }, []);

  const handleUpdateStoreProfile = async (payload: { businessName: string; logoUrl?: string; supportWhatsapp: string }) => {
    try {
      const res = await api.updateStoreProfile(payload);
      if (res.success) {
        setStoreProfile({
          businessName: payload.businessName,
          logoUrl: payload.logoUrl || storeProfile.logoUrl,
          supportWhatsapp: payload.supportWhatsapp,
        });
        return { success: true, message: 'Profil toko berhasil disimpan' };
      }
      return { success: false, message: res.message || 'Gagal menyimpan profil toko' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem' };
    }
  };

  const loginAdmin = async (credentials: { email: string; password: string }) => {
    try {
      const res = await api.adminLogin(credentials);
      if (res.success && res.user) {
        setAdminUser(res.user);
        setIsAdminLoggedIn(true);
        localStorage.setItem('rp_admin_logged_in', 'true');
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: res.message || 'Email atau password salah.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memproses login.' };
    }
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.setItem('rp_admin_logged_in', 'false');
  };

  return (
    <StoreContext.Provider
      value={{
        storeProfile,
        adminUser,
        isAdminLoggedIn,
        isLoading,
        refreshStoreProfile: fetchProfile,
        updateStoreProfile: handleUpdateStoreProfile,
        loginAdmin,
        logoutAdmin,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isPrivacyHidden,
        togglePrivacy,
        isMobileFrameView,
        setIsMobileFrameView,
        toggleMobileFrameView,
        sourceMode,
        setSourceMode,
        toggleSourceMode,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreSettings = () => useContext(StoreContext);
