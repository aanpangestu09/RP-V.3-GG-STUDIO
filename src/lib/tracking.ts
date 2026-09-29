import { TrackingEventType } from '../types/schema';

export const AVAILABLE_TRACKING_EVENTS: TrackingEventType[] = [
  'View Content',
  'InitiateCheckout',
  'Purchase',
  'AddToCart',
  'Lead',
  'AddPaymentInfo'
];

export interface TrackingPayload {
  eventName: TrackingEventType | string;
  orderId?: string;
  value?: number;
  currency?: string;
  productId?: string;
  productName?: string;
  url?: string;
  customerEmail?: string;
  customerPhone?: string;
  platform?: 'META' | 'TIKTOK' | 'GOOGLE' | 'ALL';
  extraData?: Record<string, any>;
}

// Convert readable names to platform standard names
const mapToMetaEvent = (eventName: string): string => {
  switch (eventName) {
    case 'View Content':
      return 'ViewContent';
    case 'InitiateCheckout':
      return 'InitiateCheckout';
    case 'Purchase':
      return 'Purchase';
    case 'AddToCart':
      return 'AddToCart';
    case 'Lead':
      return 'Lead';
    case 'AddPaymentInfo':
      return 'AddPaymentInfo';
    default:
      return eventName.replace(/\s+/g, '');
  }
};

const mapToTikTokEvent = (eventName: string): string => {
  switch (eventName) {
    case 'View Content':
      return 'ViewContent';
    case 'InitiateCheckout':
      return 'InitiateCheckout';
    case 'Purchase':
      return 'CompletePayment';
    case 'AddToCart':
      return 'AddToCart';
    case 'Lead':
      return 'SubmitForm';
    case 'AddPaymentInfo':
      return 'AddPaymentInfo';
    default:
      return eventName.replace(/\s+/g, '');
  }
};

export const fireTrackingEvent = async (payload: TrackingPayload): Promise<void> => {
  const { eventName, orderId, value, currency = 'IDR', productId, productName, url = window.location.pathname } = payload;
  const metaEvent = mapToMetaEvent(eventName);
  const tikTokEvent = mapToTikTokEvent(eventName);

  // 1. Client-side Meta Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    try {
      (window as any).fbq('track', metaEvent, {
        content_name: productName,
        content_ids: productId ? [productId] : undefined,
        content_type: 'product',
        value: value,
        currency: currency,
        order_id: orderId
      });
    } catch (e) {
      console.warn('[Tracking] Meta Pixel error:', e);
    }
  }

  // 2. Client-side TikTok Pixel
  if (typeof window !== 'undefined' && (window as any).ttq) {
    try {
      (window as any).ttq.track(tikTokEvent, {
        content_name: productName,
        content_id: productId,
        value: value,
        currency: currency
      });
    } catch (e) {
      console.warn('[Tracking] TikTok Pixel error:', e);
    }
  }

  // 3. Client-side Google Tag / Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', metaEvent.toLowerCase(), {
        transaction_id: orderId,
        value: value,
        currency: currency,
        items: productId ? [{ id: productId, name: productName }] : []
      });
    } catch (e) {
      console.warn('[Tracking] GTag error:', e);
    }
  }

  // 4. Server-Side Logging & CAPI Simulation via backend
  try {
    await fetch('/api/tracking/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: payload.platform || 'META',
        eventName: metaEvent,
        payload: {
          url: url || window.location.href,
          orderId,
          value,
          currency,
          productId,
          productName
        }
      })
    });
  } catch (err) {
    // Non-blocking in frontend
    console.debug('[Tracking] Server log silent fail:', err);
  }

  // 5. Dispatch Custom Event for UI Debugging / Notifications
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-tracking-dispatched', {
        detail: {
          eventName,
          metaEvent,
          value,
          orderId,
          timestamp: new Date().toISOString()
        }
      })
    );
  }
};
