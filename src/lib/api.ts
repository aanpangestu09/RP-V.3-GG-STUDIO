import {
  Product,
  Order,
  Customer,
  Coupon,
  AbandonedCheckout,
  NotificationLog,
  WebhookLog,
  AuditLog,
  PlatformSettings
} from '../types/schema';

export const api = {
  // Products
  async getProducts(status?: string): Promise<Product[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`/api/products${query}`);
    const data = await res.json();
    return data.data || [];
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const res = await fetch(`/api/products/${slug}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    return data.data;
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    return data.data;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Checkout & Orders
  async submitCheckout(payload: {
    productId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCompany?: string;
    paymentMethod: string;
    includeOrderBump?: boolean;
    selectedBumpIds?: string[];
    couponCode?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  }): Promise<{ success: boolean; order: Order; payment: any; message?: string }> {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getOrder(id: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.order;
  },

  async acceptUpsell(orderId: string, payload: { acceptUpsell: boolean; upsellTitle?: string; upsellPrice?: number }): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/upsell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.order;
  },

  async resendDelivery(orderId: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${orderId}/resend-delivery`, { method: 'POST' });
    return res.ok;
  },

  async refundOrder(orderId: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${orderId}/refund`, { method: 'POST' });
    return res.ok;
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${orderId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalNotes: notes })
    });
    return res.ok;
  },

  // Payment Webhook Simulation / Sandbox
  async triggerWebhook(payload: {
    orderNumber: string;
    transactionId?: string;
    transactionStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'expire' | 'cancel' | 'refund';
    grossAmount?: number;
    signatureKey?: string;
    provider?: string;
  }): Promise<{ success: boolean; message: string; isDuplicate?: boolean; order?: Order; signatureValid?: boolean }> {
    const res = await fetch('/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerMidtransWebhook(payload: any): Promise<any> {
    const res = await fetch('/api/webhooks/midtrans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerXenditWebhook(payload: any, token: string = ''): Promise<any> {
    const res = await fetch('/api/webhooks/xendit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': token
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerTripayWebhook(payload: any, signature: string = ''): Promise<any> {
    const res = await fetch('/api/webhooks/tripay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-signature': signature
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerDuitkuWebhook(payload: any): Promise<any> {
    const res = await fetch('/api/webhooks/duitku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async replayWebhook(webhookId: string): Promise<any> {
    const res = await fetch(`/api/webhooks/replay/${webhookId}`, { method: 'POST' });
    return res.json();
  },

  // Secure Download Validation & Quota Controls
  async validateDownloadToken(token: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch(`/api/download/validate/${token}`);
    return res.json();
  },

  async resetDownloadQuota(token: string, adminName?: string): Promise<{ success: boolean; message: string; download?: any }> {
    const res = await fetch(`/api/downloads/${token}/reset-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName })
    });
    return res.json();
  },

  async toggleDownloadRevoke(token: string, adminName?: string): Promise<{ success: boolean; isRevoked: boolean; message: string }> {
    const res = await fetch(`/api/downloads/${token}/toggle-revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName })
    });
    return res.json();
  },

  async extendDownloadExpiry(token: string, additionalDays: number = 30, adminName?: string): Promise<{ success: boolean; newExpiresAt: string; message: string }> {
    const res = await fetch(`/api/downloads/${token}/extend-expiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalDays, adminName })
    });
    return res.json();
  },

  async getDownloadLogs(token: string): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`/api/downloads/${token}/logs`);
    return res.json();
  },

  // License Keys
  async getLicenses(): Promise<any[]> {
    const res = await fetch('/api/licenses');
    const data = await res.json();
    return data.data || [];
  },

  async verifyLicense(licenseKey: string): Promise<{ valid: boolean; reason?: string; license?: any; productName?: string }> {
    const res = await fetch('/api/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey })
    });
    return res.json();
  },

  async activateLicense(licenseKey: string, deviceName?: string): Promise<{ success: boolean; message: string; activationsRemaining?: number }> {
    const res = await fetch('/api/licenses/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, deviceName })
    });
    return res.json();
  },

  async resetLicense(id: string, adminName?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/licenses/${id}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName })
    });
    return res.json();
  },

  // Customer Self-Service Order Lookup
  async lookupOrders(query: string): Promise<{ success: boolean; data: any[]; message?: string }> {
    const res = await fetch('/api/orders/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  // Coupons
  async validateCoupon(code: string, subtotalAmount: number): Promise<{
    success: boolean;
    coupon?: { code: string; discountType: string; discountValue: number; discountAmount: number };
    message?: string;
  }> {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotalAmount })
    });
    return res.json();
  },

  async getCoupons(): Promise<Coupon[]> {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    return data.data || [];
  },

  async createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
    const data = await res.json();
    return data.data;
  },

  // Abandoned Carts
  async getAbandoned(): Promise<AbandonedCheckout[]> {
    const res = await fetch('/api/abandoned');
    const data = await res.json();
    return data.data || [];
  },

  async recoverAbandoned(id: string): Promise<boolean> {
    const res = await fetch(`/api/abandoned/${id}/recover`, { method: 'POST' });
    return res.ok;
  },

  // Admin Metrics & CRM
  async getAdminMetrics(params?: { startDate?: string; endDate?: string; filter?: string; period?: string; sourceMode?: string }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.filter) searchParams.set('filter', params.filter);
    if (params?.period) searchParams.set('period', params.period);
    if (params?.sourceMode) searchParams.set('sourceMode', params.sourceMode);
    const qs = searchParams.toString();
    const res = await fetch(`/api/admin/metrics${qs ? '?' + qs : ''}`);
    const data = await res.json();
    return data.data;
  },

  async runE2ETestSuite(): Promise<any> {
    const res = await fetch('/api/e2e/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.data;
  },

  async getTrackingLogs(): Promise<any[]> {
    const res = await fetch('/api/tracking/logs');
    const data = await res.json();
    return data.data || [];
  },

  async sendTestTrackingEvent(payload: { platform: string; eventName: string; value?: number; orderId?: string }): Promise<any> {
    const res = await fetch('/api/tracking/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    const data = await res.json();
    return data.data || [];
  },

  async getNotificationLogs(): Promise<NotificationLog[]> {
    const res = await fetch('/api/notifications/logs');
    const data = await res.json();
    return data.data || [];
  },

  async getWebhookLogs(): Promise<WebhookLog[]> {
    const res = await fetch('/api/webhooks/logs');
    const data = await res.json();
    return data.data || [];
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    const data = await res.json();
    return data.data || [];
  },

  async getSettings(): Promise<PlatformSettings> {
    const res = await fetch('/api/settings');
    const data = await res.json();
    return data.data;
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    return data.data;
  },

  async updateStoreProfile(payload: {
    businessName: string;
    logoUrl?: string;
    supportWhatsapp: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async uploadLogo(dataUrl: string): Promise<{ success: boolean; url?: string; message?: string }> {
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl })
    });
    return res.json();
  },

  async uploadImage(dataUrl: string): Promise<{ success: boolean; url?: string; message?: string }> {
    return this.uploadLogo(dataUrl);
  },

  async changeAdminPassword(payload: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getAdminProfile(): Promise<{ success: boolean; data: { id: string; name: string; email: string; role: string } }> {
    const res = await fetch('/api/admin/profile');
    return res.json();
  },

  async adminLogin(payload: { email: string; password: string }): Promise<{ success: boolean; message?: string; user?: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // WhatsApp Follow-Up Otomatis
  async getFollowUpSettings(): Promise<any> {
    const res = await fetch('/api/follow-up/whatsapp/settings');
    const data = await res.json();
    return data.data;
  },

  async updateFollowUpSettings(settings: any): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch('/api/follow-up/whatsapp/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async getFollowUpLogs(): Promise<NotificationLog[]> {
    const res = await fetch('/api/follow-up/whatsapp/logs');
    const data = await res.json();
    return data.data || [];
  },

  async sendFollowUpTest(payload: { phone: string; category: string; customMessage?: string }): Promise<{ success: boolean; message: string; log?: NotificationLog }> {
    const res = await fetch('/api/follow-up/whatsapp/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerFollowUpNow(): Promise<{ success: boolean; message: string; sentCount: number }> {
    const res = await fetch('/api/follow-up/whatsapp/trigger-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async resendFollowUpMessage(id: string): Promise<{ success: boolean; message: string; log?: NotificationLog }> {
    const res = await fetch(`/api/follow-up/whatsapp/resend/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};
