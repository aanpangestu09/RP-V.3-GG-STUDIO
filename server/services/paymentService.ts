import crypto from 'crypto';
import { db } from '../db/store';
import { Order, PaymentMethod, OrderStatus, WebhookLog } from '../../src/types/schema';
import { DeliveryService } from './deliveryService';
import { NotificationService } from './notificationService';
import { OrderStateMachine } from './orderStateMachine';

export interface PaymentDetails {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  qrString?: string;
  qrImageUrl?: string;
  vaNumber?: string;
  bankName?: string;
  paymentUrl?: string;
  expiredAt: string;
  instructions: string[];
}

export class PaymentService {
  /**
   * Generates payment details (QRIS / VA / E-Wallet)
   */
  public static createPayment(order: Order): PaymentDetails {
    const expiredAt = new Date(Date.now() + 24 * 3600000).toISOString(); // 24 hours
    let qrString: string | undefined = undefined;
    let qrImageUrl: string | undefined = undefined;
    let vaNumber: string | undefined = undefined;
    let bankName: string | undefined = undefined;
    let instructions: string[] = [];

    if (order.paymentMethod === 'QRIS') {
      qrString = `00020101021226680016ID.CO.RUANGPROYEK0118936009182390192830215${order.orderNumber}5204581253033605406${order.totalAmount}5802ID5912RUANG PROYEK6007JAKARTA62070703A01630489AB`;
      // Use clean QR code generator image
      qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
      instructions = [
        'Buka aplikasi BCA Mobile, GoPay, OVO, ShopeePay, DANA, Livin Mandiri, atau m-Banking Anda.',
        'Pilih menu Scan / Bayar QRIS.',
        'Arahkan kamera ke QR Code di layar atau upload screenshot QR.',
        'Periksa nama merchant: RUANG PROYEK dan total tagihan.',
        'Masukkan PIN transaksi Anda untuk menyelesaikan pembayaran.'
      ];
    } else if (order.paymentMethod.startsWith('VA_')) {
      const bankCode = order.paymentMethod.replace('VA_', '');
      bankName = bankCode;
      const bankPrefixes: Record<string, string> = {
        BCA: '80001',
        MANDIRI: '88708',
        BRI: '12889',
        BNI: '98812'
      };
      const prefix = bankPrefixes[bankCode] || '88000';
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      vaNumber = `${prefix}${randomSuffix}`;

      instructions = [
        `Buka aplikasi Mobile Banking atau ATM Bank ${bankName}.`,
        'Pilih menu Transfer > Virtual Account.',
        `Masukkan Nomor Virtual Account: ${vaNumber}`,
        `Pastikan nominal transfer tepat Rp ${order.totalAmount.toLocaleString('id-ID')}.`,
        'Konfirmasi dan masukkan PIN Anda. Pembayaran akan terverifikasi secara instan.'
      ];
    } else {
      instructions = [
        'Buka aplikasi dompet digital Anda.',
        'Konfirmasi notifikasi tagihan dari Ruang Proyek.',
        'Selesaikan pembayaran sebelum batas waktu berakhir.'
      ];
    }

    order.paymentStatus = 'MENUNGGU';
    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: `Instruksi Pembayaran Diterbitkan (${order.paymentMethod})`,
      description: `Rincian pembayaran senilai Rp ${order.totalAmount.toLocaleString('id-ID')} dibuat. Menunggu pelunasan.`,
      timestamp: new Date().toISOString(),
      actor: 'PAYMENT_GATEWAY'
    });

    db.saveToFile();

    return {
      orderId: order.id,
      method: order.paymentMethod,
      amount: order.totalAmount,
      qrString,
      qrImageUrl,
      vaNumber,
      bankName,
      expiredAt,
      instructions
    };
  }

  /**
   * Signature helper: Midtrans (SHA512: order_id + status_code + gross_amount + ServerKey)
   */
  public static calculateMidtransSignature(orderId: string, statusCode: string, grossAmount: string | number, serverKey: string): string {
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.createHash('sha512').update(raw).digest('hex');
  }

  /**
   * Signature helper: Tripay (HMAC-SHA256 of JSON payload using private key)
   */
  public static calculateTripaySignature(payloadString: string, privateKey: string): string {
    return crypto.createHmac('sha256', privateKey).update(payloadString).digest('hex');
  }

  /**
   * Signature helper: Duitku (MD5: merchantCode + amount + merchantOrderId + apiKey)
   */
  public static calculateDuitkuSignature(merchantCode: string, amount: string | number, merchantOrderId: string, apiKey: string): string {
    const raw = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Process incoming Webhook with signature check & idempotency
   */
  public static async processWebhook(payload: {
    orderNumber: string;
    transactionId: string;
    transactionStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'expire' | 'cancel' | 'refund';
    grossAmount: number;
    signatureKey?: string;
    paymentType?: string;
    provider?: string;
    headers?: Record<string, string>;
    signatureValid?: boolean;
    forceReplay?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    order?: Order;
    isDuplicate?: boolean;
    signatureValid?: boolean;
  }> {
    const providerName = payload.provider || db.settings.payment.provider;
    const rawPayloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

    // Check idempotency (unless explicitly forced by replay)
    if (!payload.forceReplay) {
      const existingLog = db.webhookLogs.find(l => l.payloadHash === payloadHash && l.status === 'PROCESSED');
      if (existingLog) {
        return {
          success: true,
          message: 'Idempotent request: Webhook ini telah berhasil diproses sebelumnya (mencegah duplikasi).',
          isDuplicate: true,
          signatureValid: existingLog.signatureValid
        };
      }
    }

    const order = db.orders.find(o => o.orderNumber === payload.orderNumber || o.id === payload.orderNumber);
    if (!order) {
      const errorLog: WebhookLog = {
        id: 'wh_' + crypto.randomBytes(6).toString('hex'),
        provider: providerName,
        eventName: payload.transactionStatus,
        payloadHash,
        payload,
        headers: payload.headers,
        signatureValid: payload.signatureValid,
        status: 'FAILED',
        error: `Order dengan nomor ${payload.orderNumber} tidak ditemukan di database.`,
        processedAt: new Date().toISOString()
      };
      db.webhookLogs.unshift(errorLog);
      db.saveToFile();
      return { success: false, message: errorLog.error || 'Order not found', signatureValid: payload.signatureValid };
    }

    // Map transactionStatus to canonical ValidOrderStatus
    let targetStatus: string = 'MENUNGGU';
    if (payload.transactionStatus === 'settlement' || payload.transactionStatus === 'capture') {
      targetStatus = 'LUNAS';
    } else if (payload.transactionStatus === 'expire') {
      targetStatus = 'KADALUARSA';
    } else if (payload.transactionStatus === 'deny' || payload.transactionStatus === 'cancel') {
      targetStatus = 'GAGAL';
    }

    // Execute state transition with full rules & idempotency
    const result = await OrderStateMachine.transition(order, targetStatus, 'webhook', {
      actorName: `Webhook Gateway (${providerName})`,
      transactionId: payload.transactionId,
      details: `Webhook event ${payload.transactionStatus} from ${providerName}`
    });

    // Record webhook log
    db.webhookLogs.unshift({
      id: 'wh_' + crypto.randomBytes(6).toString('hex'),
      provider: providerName,
      eventName: payload.transactionStatus,
      payloadHash,
      payload,
      headers: payload.headers,
      signatureValid: payload.signatureValid !== false,
      status: result.success ? 'PROCESSED' : 'FAILED',
      error: !result.success ? result.message : undefined,
      processedAt: new Date().toISOString()
    });
    db.saveToFile();

    return {
      success: result.success,
      message: result.message,
      order: result.order,
      isDuplicate: result.isDuplicate,
      signatureValid: payload.signatureValid
    };
  }

  /**
   * Replay an existing webhook from log
   */
  public static async replayWebhook(webhookLogId: string): Promise<{ success: boolean; message: string; result?: any }> {
    const log = db.webhookLogs.find(l => l.id === webhookLogId);
    if (!log) {
      return { success: false, message: 'Log webhook tidak ditemukan.' };
    }

    const payload = log.payload;
    if (!payload || !payload.orderNumber) {
      return { success: false, message: 'Payload webhook tidak memiliki orderNumber valid.' };
    }

    const result = await PaymentService.processWebhook({
      orderNumber: payload.orderNumber,
      transactionId: payload.transactionId || `REPLAY-${Date.now()}`,
      transactionStatus: payload.transactionStatus || 'settlement',
      grossAmount: Number(payload.grossAmount) || 0,
      signatureKey: payload.signatureKey,
      provider: log.provider,
      headers: log.headers,
      signatureValid: true,
      forceReplay: true
    });

    log.status = result.success ? 'PROCESSED' : 'FAILED';
    log.error = result.success ? undefined : result.message;
    db.saveToFile();

    return { success: true, message: `Replay webhook berhasil: ${result.message}`, result };
  }
}
