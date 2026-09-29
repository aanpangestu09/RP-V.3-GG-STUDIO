import crypto from 'crypto';
import { db } from '../db/store';
import { Order, NotificationLog } from '../../src/types/schema';

export class NotificationService {
  /**
   * Format Rupiah currency
   */
  private static formatRupiah(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }

  /**
   * Send Email to customer
   */
  public static async sendOrderPaidEmail(order: Order, downloadUrl: string): Promise<NotificationLog> {
    const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
    const settings = db.settings;

    const subject = `Pesanan Anda Berhasil — ${mainItem?.productName || settings.general.businessName}`;
    const emailBody = `
[HEADER LOGO: ${settings.general.logoUrl}]
${settings.general.businessName.toUpperCase()} — DIGITAL PRODUCT DELIVERY
============================================================

Halo ${order.customerName},

Terima kasih atas kepercayaan Anda berbelanja di ${settings.general.businessName}.
Pembayaran untuk pesanan ${order.orderNumber} telah kami terima dan diverifikasi.

Rincian Pesanan:
- Order ID: ${order.orderNumber}
- Produk: ${mainItem?.productName}
- Total Pembayaran: ${this.formatRupiah(order.totalAmount)}
- Metode Pembayaran: ${order.paymentMethod}
- Status: SUKSES / LUNAS

${order.licenseKey ? `Lisensi Produk Anda:\n[ ${order.licenseKey} ]\n` : ''}

Akses & Unduh Produk Anda di tautan aman berikut:
${downloadUrl}

Tautan unduhan di atas bersifat pribadi dan aman. Jika Anda membutuhkan bantuan, silakan hubungi tim kami via WhatsApp di ${settings.general.supportWhatsapp} atau email ${settings.general.supportEmail}.

Salam hangat,
Tim ${settings.general.businessName}
    `.trim();

    const log: NotificationLog = {
      id: 'notif_email_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      channel: 'EMAIL',
      recipient: order.customerEmail,
      subjectOrTitle: subject,
      messageBody: emailBody,
      status: settings.email.isEnabled ? 'SENT' : 'PENDING',
      sentAt: new Date().toISOString()
    };

    db.notificationLogs.unshift(log);

    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: 'Email Konfirmasi & Link Akses Terkirim',
      description: `Email resmi berhasil dikirim ke ${order.customerEmail}. Subjek: "${subject}"`,
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM'
    });

    db.saveToFile();
    return log;
  }

  /**
   * Send WhatsApp notification to customer
   */
  public static async sendOrderPaidWhatsApp(order: Order, downloadUrl: string): Promise<NotificationLog> {
    const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
    const settings = db.settings;

    const message = `
Halo *${order.customerName}* 👋

Pembayaran Anda untuk *${mainItem?.productName}* telah BERHASIL diverifikasi! 🎉

📋 *Rincian Pesanan:*
• Order ID: ${order.orderNumber}
• Total: ${this.formatRupiah(order.totalAmount)}
• Pembayaran: ${order.paymentMethod}
• Status: *PAID (Lunas)*
${order.licenseKey ? `• License Key: *${order.licenseKey}*\n` : ''}
🚀 *Akses & Download Produk Anda Sekarang:*
${downloadUrl}

_Simpan pesan ini untuk mengakses file Anda kapan saja._

Jika butuh panduan, tim kami siap membantu. Terima kasih telah menggunakan ${settings.general.businessName}! 🙏
    `.trim();

    const log: NotificationLog = {
      id: 'notif_wa_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      channel: 'WHATSAPP',
      recipient: order.customerPhone,
      subjectOrTitle: `WhatsApp ke ${order.customerPhone}`,
      messageBody: message,
      status: settings.whatsapp.isEnabled ? 'SENT' : 'PENDING',
      sentAt: new Date().toISOString()
    };

    db.notificationLogs.unshift(log);

    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: 'WhatsApp Notifikasi Terkirim',
      description: `Pesan akses digital WhatsApp terkirim ke ${order.customerPhone}.`,
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM'
    });

    db.saveToFile();
    return log;
  }

  /**
   * Send Telegram Alert to Admin
   */
  public static async sendAdminTelegramNotification(order: Order): Promise<NotificationLog> {
    const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
    const settings = db.settings;

    const text = `
🔔 *PESANAN BARU BERHASIL DIVERIFIKASI*

Order: \`${order.orderNumber}\`
Customer: *${order.customerName}* (${order.customerPhone})
Email: ${order.customerEmail}
Product: *${mainItem?.productName}*
${order.orderBumpAdded ? 'Order Bump: *Ya (+Dynamic Blocks)*\n' : ''}Total: *${this.formatRupiah(order.totalAmount)}*
Metode: *${order.paymentMethod}*
UTM Source: ${order.utmSource || 'Direct / Organic'}
Status: *PAID (Delivery Sent)*

🕒 ${new Date().toLocaleTimeString('id-ID')} WIB
    `.trim();

    const log: NotificationLog = {
      id: 'notif_tg_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      channel: 'TELEGRAM',
      recipient: `Telegram Admin Channel (${settings.telegram.chatId})`,
      subjectOrTitle: `Admin Alert ${order.orderNumber}`,
      messageBody: text,
      status: settings.telegram.isEnabled ? 'SENT' : 'PENDING',
      sentAt: new Date().toISOString()
    };

    db.notificationLogs.unshift(log);

    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: 'Notifikasi Admin Telegram Terkirim',
      description: `Notifikasi instan order baru berhasil dikirim ke Telegram Bot admin.`,
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM'
    });

    db.saveToFile();
    return log;
  }

  /**
   * Render dynamic variables into WhatsApp template
   */
  public static renderTemplate(template: string, vars: {
    nama_pembeli: string;
    nama_produk: string;
    total_harga: string;
    link_pembayaran: string;
    link_produk: string;
    nomor_order: string;
  }): string {
    let result = template;
    result = result.replace(/\{nama_pembeli\}/gi, vars.nama_pembeli || '');
    result = result.replace(/\{nama_produk\}/gi, vars.nama_produk || '');
    result = result.replace(/\{total_harga\}/gi, vars.total_harga || '');
    result = result.replace(/\{link_pembayaran\}/gi, vars.link_pembayaran || '');
    result = result.replace(/\{link_produk\}/gi, vars.link_produk || '');
    result = result.replace(/\{nomor_order\}/gi, vars.nomor_order || '');
    return result;
  }

  /**
   * Direct WhatsApp Dispatcher & Logger
   */
  public static async sendWhatsAppDirect(
    recipient: string,
    message: string,
    orderId?: string,
    title?: string
  ): Promise<NotificationLog> {
    const log: NotificationLog = {
      id: 'notif_wa_' + crypto.randomBytes(6).toString('hex'),
      orderId: orderId || 'manual',
      channel: 'WHATSAPP',
      recipient: recipient,
      subjectOrTitle: title || `Follow Up WA ke ${recipient}`,
      messageBody: message,
      status: 'SENT',
      sentAt: new Date().toISOString()
    };

    db.notificationLogs.unshift(log);

    if (orderId && orderId !== 'manual') {
      const order = db.orders.find(o => o.id === orderId);
      if (order) {
        order.timeline.push({
          id: 'tl_' + crypto.randomBytes(6).toString('hex'),
          orderId: order.id,
          title: 'Follow Up WhatsApp Terkirim',
          description: `Pesan otomatis/manual terkirim ke ${recipient}: "${title || 'Follow Up'}"`,
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM'
        });
      }
    }

    db.saveToFile();
    return log;
  }
}
