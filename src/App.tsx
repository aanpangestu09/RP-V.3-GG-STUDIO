import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { FunnelHeader } from './components/layout/FunnelHeader';
import { Footer } from './components/layout/Footer';
import { Storefront } from './components/public/Storefront';
import { ProductLandingPage } from './components/public/ProductLandingPage';
import { CheckoutPage } from './components/public/CheckoutPage';
import { PaymentScreen } from './components/public/PaymentScreen';
import { UpsellPage } from './components/public/UpsellPage';
import { ThankYouPage } from './components/public/ThankYouPage';
import { SecureDownloadPortal } from './components/public/SecureDownloadPortal';
import { OrderLookupModal } from './components/public/OrderLookupModal';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileQuickSupportModal } from './components/public/MobileQuickSupportModal';
import { MobileAppSimulator } from './components/mobile/MobileAppSimulator';
import { StoreProvider, useStoreSettings } from './context/StoreContext';

// Admin views
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminAbandoned } from './components/admin/AdminAbandoned';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminMarketing } from './components/admin/AdminMarketing';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AdminSimulator } from './components/admin/AdminSimulator';
import { AdminWhatsAppFollowUp } from './components/admin/AdminWhatsAppFollowUp';
import { AdminTrackingPixel } from './components/admin/AdminTrackingPixel';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminGatewaySettings } from './components/admin/AdminGatewaySettings';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';

import { Product, Order } from './types/schema';
import { api } from './lib/api';

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('storefront');
  const [activeProductSlug, setActiveProductSlug] = useState<string>('10000-template-arsitektur-pro');
  
  // Checkout & Payment Active States
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [activeDownloadToken, setActiveDownloadToken] = useState<string>('');
  
  // Admin selected order for detail view
  const [adminSelectedOrderId, setAdminSelectedOrderId] = useState<string | undefined>(undefined);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    isAdminLoggedIn,
    isMobileFrameView,
    setIsMobileFrameView
  } = useStoreSettings();

  // Load products list initially
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
      if (data.length > 0 && !activeProductSlug) {
        setActiveProductSlug(data[0].slug);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // Check URL path on mount
    const path = window.location.pathname;
    if (path.startsWith('/download/')) {
      const token = path.replace('/download/', '');
      if (token) {
        setActiveDownloadToken(token);
        setCurrentView('download');
      }
    } else if (path.startsWith('/p/')) {
      const slug = path.replace('/p/', '');
      if (slug) {
        setActiveProductSlug(slug);
        setCurrentView('product-detail');
      }
    } else if (path.startsWith('/checkout/')) {
      const slug = path.replace('/checkout/', '');
      if (slug) {
        setActiveProductSlug(slug);
        setCurrentView('checkout');
      }
    } else if (path === '/admin/settings' || path === '/admin/settings/') {
      setCurrentView('admin-settings');
    } else if (path === '/admin/login' || path === '/admin/login/') {
      setIsLoginModalOpen(true);
      setCurrentView('storefront');
    } else if (path.startsWith('/admin')) {
      const tab = path.replace(/^\/admin\/?/, '');
      if (tab) {
        setCurrentView(`admin-${tab}`);
      } else {
        setCurrentView('admin-dashboard');
      }
    }
  }, []);

  // Selected product object
  const activeProduct = products.find(p => p.slug === activeProductSlug || p.id === activeProductSlug) || products[0];

  // Handlers for public flow
  const handleSelectProduct = (slug: string) => {
    setActiveProductSlug(slug);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDirectCheckout = (slug: string) => {
    setActiveProductSlug(slug);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentCreated = (orderId: string, payment: any) => {
    setCurrentOrderId(orderId);
    setPaymentDetails(payment);
    setCurrentView('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSuccess = (paidOrder: Order) => {
    setCurrentOrder(paidOrder);
    // If order has available upsell and not yet added, show upsell offer
    if (activeProduct?.upsell && activeProduct.upsell.isActive && !paidOrder.upsellAdded) {
      setCurrentView('upsell');
    } else {
      setCurrentView('thank-you');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpsellComplete = (finalOrder: Order) => {
    setCurrentOrder(finalOrder);
    setCurrentView('thank-you');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDownload = (token: string) => {
    setActiveDownloadToken(token);
    setCurrentView('download');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'admin-dashboard') {
      if (!isAdminLoggedIn) {
        setIsLoginModalOpen(true);
        return;
      }
      setCurrentView('admin-dashboard');
    } else if (view === 'admin-simulator') {
      setCurrentView('admin-simulator');
    } else {
      setCurrentView(view);
      if (param) setActiveProductSlug(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------
  // ADMIN PORTAL VIEWS
  // ----------------------------------------------------
  if (currentView.startsWith('admin-')) {
    const adminTab = currentView.replace('admin-', '');

    return (
      <>
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={(tab) => {
            setAdminSelectedOrderId(undefined);
            setCurrentView(`admin-${tab}`);
          }}
          onExitAdmin={() => setCurrentView('storefront')}
          onLogout={() => {
            setIsLoginModalOpen(true);
            setCurrentView('storefront');
          }}
        >
          {adminTab === 'dashboard' && (
            <AdminDashboard
              onNavigateTab={(tab) => setCurrentView(`admin-${tab}`)}
              onViewOrder={(orderId) => {
                setAdminSelectedOrderId(orderId);
                setCurrentView('admin-orders');
              }}
            />
          )}
          {adminTab === 'orders' && (
            <AdminOrders initialSelectedOrderId={adminSelectedOrderId} />
          )}
          {adminTab === 'products' && (
            <AdminProducts
              onPreviewProduct={(slug) => {
                setActiveProductSlug(slug);
                setCurrentView('product-detail');
              }}
            />
          )}
          {adminTab === 'abandoned' && <AdminAbandoned />}
          {adminTab === 'customers' && <AdminCustomers />}
          {adminTab === 'marketing' && <AdminMarketing />}
          {adminTab === 'analytics' && <AdminAnalytics />}
          {adminTab === 'notifications' && <AdminNotifications />}
          {adminTab === 'whatsapp-followup' && <AdminWhatsAppFollowUp />}
          {adminTab === 'tracking-pixel' && <AdminTrackingPixel />}
          {adminTab === 'simulator' && <AdminSimulator />}
          {adminTab === 'gateway' && <AdminGatewaySettings />}
          {adminTab === 'settings' && <AdminSettings />}
          {adminTab === 'audit-logs' && <AdminAuditLogs />}
        </AdminLayout>

        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setCurrentView('admin-dashboard')}
        />
      </>
    );
  }

  // ----------------------------------------------------
  // SECURE TOKENIZED DOWNLOAD PORTAL VIEW
  // ----------------------------------------------------
  if (currentView === 'download') {
    return (
      <SecureDownloadPortal
        token={activeDownloadToken}
        onBackToHome={() => setCurrentView('storefront')}
      />
    );
  }

  // ----------------------------------------------------
  // PUBLIC STOREFRONT & SALES FUNNEL VIEWS
  // ----------------------------------------------------
  // Render the core storefront layout
  const renderStorefrontContent = () => {
    const isFunnel = currentView === 'checkout' || currentView === 'payment' || currentView === 'thank-you' || currentView === 'upsell';
    const isFrontPage = currentView === 'storefront';

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        {/* Top Header: Standard Navbar only on Storefront & Product Landing; Clean FunnelHeader on checkout, payment, upsell, and thank-you */}
        {isFunnel ? (
          <FunnelHeader 
            title={
              currentView === 'checkout'
                ? 'Checkout Resmi & Aman'
                : currentView === 'payment'
                ? 'Pembayaran Resmi & Terverifikasi'
                : currentView === 'upsell'
                ? 'Penawaran Spesial Terbatas'
                : 'Pesanan Selesai'
            }
            onBackToHome={() => setCurrentView('storefront')}
          />
        ) : (
          <Navbar 
            currentView={currentView} 
            onNavigate={handleNavigate} 
            onOpenLookup={() => setIsLookupOpen(true)}
          />
        )}

        <main className="flex-1">
          {/* VIEW 1: STOREFRONT */}
          {currentView === 'storefront' && (
            <Storefront
              products={products}
              onSelectProduct={handleSelectProduct}
              onDirectCheckout={handleDirectCheckout}
            />
          )}

          {/* VIEW 2: PRODUCT LANDING PAGE */}
          {currentView === 'product-detail' && activeProduct && (
            <ProductLandingPage
              product={activeProduct}
              onProceedToCheckout={handleDirectCheckout}
            />
          )}

          {/* VIEW 3: CHECKOUT PAGE */}
          {currentView === 'checkout' && activeProduct && (
            <CheckoutPage
              product={activeProduct}
              onPaymentCreated={handlePaymentCreated}
              onBack={() => setCurrentView('product-detail')}
            />
          )}

          {/* VIEW 4: PAYMENT SCREEN */}
          {currentView === 'payment' && currentOrderId && paymentDetails && (
            <PaymentScreen
              orderId={currentOrderId}
              paymentDetails={paymentDetails}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setCurrentView('storefront')}
            />
          )}

          {/* VIEW 5: UPSELL PAGE */}
          {currentView === 'upsell' && currentOrder && (
            <UpsellPage
              order={currentOrder}
              upsellOffer={activeProduct?.upsell}
              onComplete={handleUpsellComplete}
            />
          )}

          {/* VIEW 6: THANK YOU PAGE */}
          {currentView === 'thank-you' && currentOrder && (
            <ThankYouPage
              order={currentOrder}
              recommendedProducts={products.filter(p => p.id !== activeProduct?.id)}
              onGoToDownload={handleGoToDownload}
              onSelectProduct={handleSelectProduct}
            />
          )}
        </main>

        {/* Footer: HANYA ada di halaman depan (storefront), tidak ngikut ke halaman checkout, pembayaran, sukses, dll */}
        {isFrontPage && <Footer />}

        {/* Mobile Bottom Navigation: HANYA ada di halaman depan (storefront) */}
        {isFrontPage && (
          <MobileBottomNav
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenLookup={() => setIsLookupOpen(true)}
            onOpenSupport={() => setIsSupportModalOpen(true)}
          />
        )}

        {/* Customer Self-Service Order Lookup Modal */}
        <OrderLookupModal
          isOpen={isLookupOpen}
          onClose={() => setIsLookupOpen(false)}
          onGoToDownload={handleGoToDownload}
        />

        {/* Mobile Quick WhatsApp Support Modal */}
        <MobileQuickSupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          onOpenLookup={() => setIsLookupOpen(true)}
        />

        {/* Admin Login Modal */}
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setCurrentView('admin-dashboard')}
        />
      </div>
    );
  };

  // If Mobile Simulator Frame is requested on desktop, present inside realistic smartphone shell
  if (isMobileFrameView) {
    return (
      <MobileAppSimulator onExit={() => setIsMobileFrameView(false)}>
        {renderStorefrontContent()}
      </MobileAppSimulator>
    );
  }

  return renderStorefrontContent();
}

export function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
