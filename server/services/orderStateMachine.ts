import crypto from 'crypto';
import { db } from '../db/store';
import { Order, ValidOrderStatus, NotificationLog, AuditLog, AbandonedCheckout } from '../../src/types/schema';
import { DeliveryService } from './deliveryService';
import { NotificationService } from './notificationService';

export interface TransitionResult {
  success: boolean;
  message: string;
  order: Order;
  isDuplicate?: boolean;
  rejected?: boolean;
  oldStatus?: string;
  newStatus?: string;
}

export type TransitionSource = 'manual' | 'simulator' | 'webhook' | 'system';

export class OrderStateMachine {
  /**
   * Terminal statuses that cannot be modified once reached.
   */
  public static readonly TERMINAL_STATUSES: ValidOrderStatus[] = ['LUNAS', 'GAGAL', 'KADALUARSA'];

  /**
   * Canonicalizes legacy or variant status strings into ValidOrderStatus.
   */
  public static normalizeStatus(status: string): ValidOrderStatus {
    const s = String(status || '').toUpperCase().trim();
    if (s === 'LUNAS' || s === 'PAID' || s === 'COMPLETED' || s === 'SETTLEMENT' || s === 'CAPTURE') {
      return 'LUNAS';
    }
    if (s === 'GAGAL' || s === 'FAILED' || s === 'CANCELLED' || s === 'DENY' || s === 'CANCEL') {
      return 'GAGAL';
    }
    if (s === 'KADALUARSA' || s === 'EXPIRED' || s === 'EXPIRE') {
      return 'KADALUARSA';
    }
    return 'MENUNGGU';
  }

  /**
   * Applies a status transition following strict business rules.
   */
  public static async transition(
    order: Order,
    targetStatusInput: string,
    source: TransitionSource = 'manual',
    context: {
      actorName?: string;
      ipAddress?: string;
      details?: string;
      transactionId?: string;
    } = {}
  ): Promise<TransitionResult> {
    const currentStatus = this.normalizeStatus(order.paymentStatus);
    const targetStatus = this.normalizeStatus(targetStatusInput);
    const ipAddress = context.ipAddress || '127.0.0.1';
    const actorName = context.actorName || (source === 'webhook' ? 'Payment Gateway Webhook' : (source === 'simulator' ? 'Simulator System' : 'Admin'));

    // 1. IDEMPOTENCY CHECK
    // If order is already in the target status:
    if (currentStatus === targetStatus) {
      if (targetStatus === 'LUNAS') {
        // Idempotent duplicate payment event!
        db.auditLogs.unshift({
          id: 'audit_' + crypto.randomBytes(6).toString('hex'),
          userName: actorName,
          userRole: 'SUPER_ADMIN',
          action: 'DUPLICATE_PAYMENT_IGNORED',
          targetType: 'ORDER',
          targetId: order.id,
          details: `Event pembayaran duplikat untuk order ${order.orderNumber} diabaikan (order sudah LUNAS sebelumnya). duplikat diabaikan. Sumber: ${source}`,
          ipAddress,
          createdAt: new Date().toISOString()
        });
        db.saveToFile();

        return {
          success: true,
          message: `duplikat diabaikan: Order ${order.orderNumber} sudah berstatus LUNAS sebelumnya.`,
          order,
          isDuplicate: true,
          oldStatus: currentStatus,
          newStatus: targetStatus
        };
      }

      return {
        success: true,
        message: `Order ${order.orderNumber} sudah dalam status ${targetStatus}.`,
        order,
        isDuplicate: true,
        oldStatus: currentStatus,
        newStatus: targetStatus
      };
    }

    // 2. TERMINAL STATE CHECK (Invalid transitions)
    // LUNAS, GAGAL, and KADALUARSA cannot transition to ANY other status!
    if (this.TERMINAL_STATUSES.includes(currentStatus)) {
      const rejectReason = `Transisi status tidak valid: status akhir ${currentStatus} tidak dapat diubah kembali menjadi ${targetStatus}.`;
      
      // Log rejection in Audit Log as strictly required by Section 1
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: actorName,
        userRole: 'SUPER_ADMIN',
        action: 'INVALID_STATUS_TRANSITION_REJECTED',
        targetType: 'ORDER',
        targetId: order.id,
        details: `DITOLAK: Percobaan mengubah order ${order.orderNumber} dari status akhir ${currentStatus} ke ${targetStatus}. Sumber: ${source}.`,
        ipAddress,
        createdAt: new Date().toISOString()
      });
      db.saveToFile();

      return {
        success: false,
        message: rejectReason,
        order,
        rejected: true,
        oldStatus: currentStatus,
        newStatus: currentStatus
      };
    }

    // 3. ALLOWED TRANSITIONS FROM MENUNGGU:
    // Only: MENUNGGU -> LUNAS | GAGAL | KADALUARSA
    if (currentStatus !== 'MENUNGGU') {
      const rejectReason = `Transisi tidak valid dari ${currentStatus} ke ${targetStatus}.`;
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: actorName,
        userRole: 'SUPER_ADMIN',
        action: 'INVALID_STATUS_TRANSITION_REJECTED',
        targetType: 'ORDER',
        targetId: order.id,
        details: `DITOLAK: ${rejectReason} Sumber: ${source}.`,
        ipAddress,
        createdAt: new Date().toISOString()
      });
      db.saveToFile();

      return {
        success: false,
        message: rejectReason,
        order,
        rejected: true,
        oldStatus: currentStatus,
        newStatus: currentStatus
      };
    }

    // 4. EXECUTE VALID TRANSITION
    const oldStatus = currentStatus;
    order.paymentStatus = targetStatus;
    order.updatedAt = new Date().toISOString();
    if (context.transactionId) {
      order.transactionId = context.transactionId;
    }

    // -----------------------------------------------------------------
    // ACTION: BECOMES LUNAS
    // -----------------------------------------------------------------
    if (targetStatus === 'LUNAS') {
      order.paidAt = new Date().toISOString();
      order.deliveryStatus = 'DELIVERED'; // tandai produk digital "terkirim"

      // Generate download token & file delivery
      const delivery = DeliveryService.generateSecureDelivery(order);
      order.downloadToken = delivery.downloadToken;

      const hostUrl = process.env.APP_URL || 'https://ruangproyek.id';
      const downloadUrl = `${hostUrl}/download/${delivery.downloadToken}`;

      // Log WhatsApp confirmation message (simulasi/log)
      const waLog: NotificationLog = {
        id: 'notif_wa_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        channel: 'WHATSAPP',
        recipient: order.customerPhone,
        subjectOrTitle: `Konfirmasi Pembayaran Lunas - ${order.orderNumber}`,
        messageBody: `Halo ${order.customerName} 🎉\n\nPembayaran untuk pesanan ${order.orderNumber} senilai Rp ${order.totalAmount.toLocaleString('id-ID')} telah terverifikasi LUNAS!\n\nProduk: ${order.items[0]?.productName || 'Produk Digital'}\nAkses & Download File Anda: ${downloadUrl}\n\nTerima kasih atas pembelian Anda!`,
        status: 'SENT',
        sentAt: new Date().toISOString()
      };
      db.notificationLogs.unshift(waLog);

      // Tambah jumlah pembelian pelanggan (totalOrders & totalSpent)
      let customer = db.customers.find(c => c.id === order.customerId || c.email === order.customerEmail);
      if (customer) {
        customer.totalOrders += 1;
        customer.totalSpent += order.totalAmount;
        customer.lastOrderAt = new Date().toISOString();
      } else {
        customer = {
          id: order.customerId || 'cust_' + crypto.randomBytes(6).toString('hex'),
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          company: order.customerCompany,
          totalOrders: 1,
          totalSpent: order.totalAmount,
          firstOrderAt: new Date().toISOString(),
          lastOrderAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        db.customers.push(customer);
      }

      // Timeline entry
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Pembayaran Lunas & Produk Terkirim',
        description: `Pembayaran terverifikasi via ${order.paymentMethod}. File digital otomatis terkirim & notifikasi WhatsApp dicatat.`,
        timestamp: new Date().toISOString(),
        actor: source === 'webhook' ? 'PAYMENT_GATEWAY' : 'SYSTEM',
        metadata: { amount: order.totalAmount, source }
      });

      // Catat di Audit Log (waktu, order, status lama, status baru, sumber)
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: actorName,
        userRole: 'SUPER_ADMIN',
        action: 'STATUS_CHANGE',
        targetType: 'ORDER',
        targetId: order.id,
        details: `Perubahan status order ${order.orderNumber}: status lama=${oldStatus}, status baru=LUNAS, sumber=${source}. Produk ditandai terkirim & WA konfirmasi tercatat.`,
        ipAddress,
        createdAt: new Date().toISOString()
      });
    }

    // -----------------------------------------------------------------
    // ACTION: BECOMES GAGAL OR KADALUARSA
    // -----------------------------------------------------------------
    if (targetStatus === 'GAGAL' || targetStatus === 'KADALUARSA') {
      // Masukkan ke daftar Abandoned
      const existingAbandoned = db.abandonedCheckouts.find(
        a => a.id === order.id || (a.customerEmail === order.customerEmail && a.productId === order.items[0]?.productId)
      );

      if (!existingAbandoned) {
        db.abandonedCheckouts.unshift({
          id: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          productId: order.items[0]?.productId || '',
          productName: order.items[0]?.productName || 'Produk Digital',
          totalAmount: order.totalAmount,
          recovered: false,
          remindersSent: 0,
          createdAt: new Date().toISOString()
        });
      }

      // Timeline entry
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: targetStatus === 'KADALUARSA' ? 'Batas Waktu Pembayaran Kadaluarsa' : 'Pembayaran Gagal / Dibatalkan',
        description: targetStatus === 'KADALUARSA' 
          ? 'Pesanan melewati batas waktu pembayaran dan dimasukkan ke daftar Abandoned.'
          : 'Pembayaran ditolak/gagal dan dimasukkan ke daftar Abandoned.',
        timestamp: new Date().toISOString(),
        actor: source === 'webhook' ? 'PAYMENT_GATEWAY' : 'SYSTEM'
      });

      // Catat di Audit Log (waktu, order, status lama, status baru, sumber)
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: actorName,
        userRole: 'SUPER_ADMIN',
        action: 'STATUS_CHANGE',
        targetType: 'ORDER',
        targetId: order.id,
        details: `Perubahan status order ${order.orderNumber}: status lama=${oldStatus}, status baru=${targetStatus}, sumber=${source}. Dimasukkan ke daftar Abandoned.`,
        ipAddress,
        createdAt: new Date().toISOString()
      });
    }

    db.saveToFile();

    return {
      success: true,
      message: `Status order ${order.orderNumber} berhasil diubah dari ${oldStatus} menjadi ${targetStatus}.`,
      order,
      oldStatus,
      newStatus: targetStatus
    };
  }

  /**
   * Sweeps and expires orders in MENUNGGU status that exceed the payment deadline.
   * @param expiryHours Default is 24 hours.
   */
  public static async sweepExpiredOrders(expiryHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - expiryHours * 3600000);
    let expiredCount = 0;

    for (const order of db.orders) {
      if (this.normalizeStatus(order.paymentStatus) === 'MENUNGGU') {
        const orderCreated = new Date(order.createdAt);
        if (orderCreated < cutoffTime) {
          await this.transition(order, 'KADALUARSA', 'system', {
            actorName: 'System Scheduler (Auto-Expire)',
            details: `Otomatis kadaluarsa setelah ${expiryHours} jam tanpa pembayaran.`
          });
          expiredCount++;
        }
      }
    }

    return expiredCount;
  }
}
