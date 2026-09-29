export type ProductType = 
  | 'FILE'
  | 'ZIP_RAR'
  | 'PDF'
  | 'EXCEL'
  | 'VIDEO'
  | 'COURSE'
  | 'SOFTWARE'
  | 'LICENSE'
  | 'LINK'
  | 'BUNDLE';

export type ValidOrderStatus = 'MENUNGGU' | 'LUNAS' | 'GAGAL' | 'KADALUARSA';

export interface TestCaseResult {
  id: string; // T1, T2, ...
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: string;
}

export interface E2ETestSuiteResult {
  success: boolean;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  results: TestCaseResult[];
  executedAt: string;
}

export type OrderStatus = 
  | 'MENUNGGU'
  | 'LUNAS'
  | 'GAGAL'
  | 'KADALUARSA'
  | 'PENDING'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export type PaymentMethod = 
  | 'QRIS'
  | 'VA_BCA'
  | 'VA_MANDIRI'
  | 'VA_BRI'
  | 'VA_BNI'
  | 'GOPAY'
  | 'SHOPEEPAY'
  | 'OVO'
  | 'CREDIT_CARD';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'SUPPORT';

export interface ProductFile {
  id: string;
  productId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;
  fileType: string;
  version: string;
  accessInstructions?: string;
  externalLink?: string;
  licenseKeyTemplate?: string;
}

export type TrackingEventType = 
  | 'View Content'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'AddToCart'
  | 'Lead'
  | 'AddPaymentInfo';

export interface OrderBump {
  id: string;
  productId?: string;
  bumpName: string;
  bumpTagline: string;
  bumpPrice: number;
  bumpThumbnail?: string;
  isActive: boolean;
  fileUrl?: string;
}

export interface UpsellOffer {
  id: string;
  triggerProductId: string;
  offerProductId: string;
  title: string;
  subtitle: string;
  specialPrice: number;
  regularPrice: number;
  headline: string;
  benefits: string[];
  thumbnail: string;
  isActive: boolean;
}

export interface ProductLandingSection {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    rating: number;
    ratingCount: number;
  };
  problem: {
    title: string;
    description: string;
    points: string[];
  };
  solution: {
    title: string;
    description: string;
    points: string[];
  };
  benefits: {
    title: string;
    items: { icon: string; title: string; desc: string }[];
  };
  whatsIncluded: {
    title: string;
    items: { name: string; size: string; type: string; desc: string }[];
  };
  faqs: { question: string; answer: string }[];
  testimonials: { name: string; role: string; avatar: string; rating: number; content: string }[];
}

export interface CheckoutTrackingPixel {
  id: string;
  name: string;
  events: string[];
  serverSide?: boolean;
  accessToken?: string;
  triggerCondition?: string;
  eventValue?: string;
  testEventCode?: string;
  allProducts?: boolean;
}

export interface CheckoutPaymentMethodOption {
  id: string;
  name: string;
  code: string;
  adminFeeText: string;
  adminFeeAmount: number;
  adminFeeType: 'FIXED' | 'PERCENT';
  gatewayTag: string;
  logoType: 'BRI' | 'BCA' | 'QRIS' | 'MANDIRI' | 'BNI' | 'GOPAY' | 'OVO';
  isActive: boolean;
}

export interface CheckoutConfig {
  bannerImage: string;
  trustBadge1: string;
  trustBadge2: string;
  recipientTitle: string;
  noticeText: string;
  ctaText: string;
  paymentMethods: CheckoutPaymentMethodOption[];
  tracking: {
    conversionRule: 'EVERY' | 'ONCE';
    checkoutEvent?: TrackingEventType | string;
    checkoutEvents?: (TrackingEventType | string)[];
    successEvent?: TrackingEventType | string;
    successEvents?: (TrackingEventType | string)[];
    facebookPixels: CheckoutTrackingPixel[];
    tiktokPixels: CheckoutTrackingPixel[];
    googleAds: CheckoutTrackingPixel[];
    googleTagManager: CheckoutTrackingPixel[];
    snackVideo: CheckoutTrackingPixel[];
  };
  successPage?: {
    headline: string;
    message: string;
    whatsappSupport: string;
    redirectUrl?: string;
    trackingEvent?: TrackingEventType | string;
    trackingEvents?: (TrackingEventType | string)[];
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  gallery: string[];
  categoryId: string;
  categoryName: string;
  regularPrice: number;
  discountPrice: number;
  productType: ProductType;
  status: 'ACTIVE' | 'DRAFT';
  sku: string;
  files: ProductFile[];
  accessDurationDays: number; // 0 for lifetime
  downloadLimit: number; // 0 for unlimited
  deliveryMode?: 'FILE' | 'LINK' | 'TEXT';
  productLinkUrl?: string;
  productTextContent?: string;
  hppPrice?: number;
  enableAccessLimit?: boolean;
  whatsappValidator?: boolean;
  enableCaptcha?: boolean;
  features?: string[];
  thankYouMessage?: string;
  orderBump?: OrderBump;
  orderBumps?: OrderBump[];
  upsell?: UpsellOffer;
  landingConfig?: ProductLandingSection;
  checkoutConfig?: CheckoutConfig;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productThumbnail?: string;
  price: number;
  itemType: 'MAIN' | 'BUMP' | 'UPSELL';
}

export interface OrderTimelineItem {
  id: string;
  orderId: string;
  title: string;
  description: string;
  timestamp: string;
  actor: 'CUSTOMER' | 'PAYMENT_GATEWAY' | 'SYSTEM' | 'ADMIN';
  metadata?: Record<string, any>;
}

export interface SecureDownload {
  id: string;
  orderId: string;
  productId: string;
  secureToken: string;
  tokenExpiresAt: string;
  downloadLimit: number;
  downloadCount: number;
  isRevoked: boolean;
  createdAt: string;
  downloadLogs: {
    id: string;
    fileId: string;
    fileName: string;
    downloadedAt: string;
    ipAddress: string;
  }[];
}

export interface LicenseKey {
  id: string;
  orderId: string;
  productId: string;
  licenseKey: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  activationLimit: number;
  activatedCount: number;
  expiresAt?: string;
  activations?: {
    id: string;
    deviceName: string;
    ipAddress: string;
    activatedAt: string;
  }[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-20260928-000123
  sourceMode?: 'test' | 'live'; // 'test' (Simulator/dummy) or 'live'
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  paymentMethod: PaymentMethod;
  paymentStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  
  transactionId?: string;
  couponCode?: string;
  orderBumpAdded: boolean;
  upsellAdded: boolean;
  
  // UTM & Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  
  // Secure Access
  downloadToken?: string;
  licenseKey?: string;
  
  timeline: OrderTimelineItem[];
  internalNotes?: string;
  
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  usageLimit: number;
  usageCount: number;
  perCustomerLimit: number;
  startDate: string;
  endDate: string;
  applicableProductIds: string[];
  isActive: boolean;
}

export interface AbandonedCheckout {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  totalAmount: number;
  recovered: boolean;
  remindersSent: number;
  lastReminderSentAt?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  orderId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'TELEGRAM';
  recipient: string;
  subjectOrTitle: string;
  messageBody: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  errorMessage?: string;
  sentAt: string;
}

export interface WebhookLog {
  id: string;
  provider: string;
  eventName: string;
  payloadHash: string;
  payload: any;
  headers?: Record<string, string>;
  signatureValid?: boolean;
  status: 'PROCESSED' | 'IGNORED' | 'FAILED';
  error?: string;
  processedAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export type FollowUpCategory = 'WAITING_PAYMENT' | 'PAID' | 'EXPIRED_FAILED';

export interface FollowUpRuleConfig {
  isEnabled: boolean;
  delayMinutes: number; // e.g. 15, 60, 360, 1440
  template: string;
}

export interface WhatsAppFollowUpSettings {
  provider: 'FONNTE' | 'WABLAS' | 'WHATSAPP_CLOUD' | 'STARSENDER';
  apiKey: string;
  senderNumber: string;
  rules: {
    waitingPayment: FollowUpRuleConfig;
    paid: FollowUpRuleConfig;
    expiredFailed: FollowUpRuleConfig;
  };
}

export interface PlatformSettings {
  general: {
    businessName: string;
    tagline: string;
    logoUrl: string;
    currency: string;
    timezone: string;
    supportEmail: string;
    supportWhatsapp: string;
  };
  payment: {
    provider: 'MIDTRANS' | 'XENDIT' | 'TRIPAY' | 'DUITKU' | 'SANDBOX';
    isSandbox: boolean;
    serverKey: string;
    clientKey: string;
    webhookSecret: string;
    merchantId: string;
  };
  email: {
    provider: 'SMTP' | 'RESEND' | 'SENDGRID';
    host: string;
    port: number;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    isEnabled: boolean;
  };
  whatsapp: {
    provider: 'FONNTE' | 'WAHA' | 'WABLAS';
    apiKey: string;
    senderNumber: string;
    isEnabled: boolean;
  };
  whatsappFollowUp?: WhatsAppFollowUpSettings;
  telegram: {
    botToken: string;
    chatId: string;
    isEnabled: boolean;
  };
  tracking: {
    metaPixelId: string;
    metaCapiToken: string;
    googleAnalyticsId: string;
    googleTagManagerId: string;
    tiktokPixelId: string;
  };
  storage: {
    provider: 'S3' | 'R2' | 'LOCAL';
    bucketName: string;
    region: string;
    accessKey: string;
    secretKey: string;
  };
}
