import crypto from 'crypto';
import { db } from '../db/store';
import { Order, SecureDownload, LicenseKey } from '../../src/types/schema';

export class DeliveryService {
  /**
   * Generates secure tokenized access & license keys for a paid order
   */
  public static generateSecureDelivery(order: Order): {
    downloadToken: string;
    licenseKey?: string;
  } {
    const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
    const product = db.products.find(p => p.id === mainItem?.productId);

    // 1. Generate unique random secure token
    const secureToken = 'sec_' + crypto.randomBytes(24).toString('hex');
    
    // Duration in days
    const accessDays = product?.accessDurationDays && product.accessDurationDays > 0 
      ? product.accessDurationDays 
      : 365; // default 1 year or lifetime
    
    const expiresAt = new Date(Date.now() + accessDays * 86400000).toISOString();
    const downloadLimit = product?.downloadLimit !== undefined ? product.downloadLimit : 10;

    const downloadRecord: SecureDownload = {
      id: 'dl_' + crypto.randomBytes(8).toString('hex'),
      orderId: order.id,
      productId: product?.id || '',
      secureToken,
      tokenExpiresAt: expiresAt,
      downloadLimit,
      downloadCount: 0,
      isRevoked: false,
      createdAt: new Date().toISOString(),
      downloadLogs: []
    };

    db.downloads.push(downloadRecord);

    // 2. Generate license key if product is software/course/license
    let licenseKeyString: string | undefined = undefined;
    if (product && ['SOFTWARE', 'LICENSE', 'COURSE', 'BUNDLE'].includes(product.productType)) {
      const seg1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg4 = crypto.randomBytes(2).toString('hex').toUpperCase();
      licenseKeyString = `RP-${seg1}-${seg2}-${seg3}-${seg4}`;

      const license: LicenseKey = {
        id: 'lic_' + crypto.randomBytes(8).toString('hex'),
        orderId: order.id,
        productId: product.id,
        licenseKey: licenseKeyString,
        status: 'ACTIVE',
        activationLimit: 2,
        activatedCount: 0,
        expiresAt
      };
      db.licenses.push(license);
    }

    // Update order
    order.downloadToken = secureToken;
    order.licenseKey = licenseKeyString;
    order.deliveryStatus = 'DELIVERED';
    order.updatedAt = new Date().toISOString();

    // Add to timeline
    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: 'Akses Produk Digital Digenerate',
      description: `Secure link token berhasil dibuat. Kuota unduhan: ${downloadLimit === 0 ? 'Unlimited' : downloadLimit + 'x'}. Kadaluarsa: ${new Date(expiresAt).toLocaleDateString('id-ID')}.`,
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM',
      metadata: { secureToken, licenseKey: licenseKeyString }
    });

    db.saveToFile();

    return {
      downloadToken: secureToken,
      licenseKey: licenseKeyString
    };
  }

  /**
   * Validate token and check quota/expiration
   */
  public static validateToken(token: string): {
    valid: boolean;
    reason?: string;
    download?: SecureDownload;
    order?: Order;
    product?: any;
    files?: any[];
  } {
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) {
      return { valid: false, reason: 'Token unduhan tidak valid atau tautan tidak ditemukan.' };
    }

    if (download.isRevoked) {
      return { valid: false, reason: 'Tautan unduhan telah dinonaktifkan oleh administrator.' };
    }

    const now = new Date();
    if (new Date(download.tokenExpiresAt) < now) {
      return { valid: false, reason: 'Masa aktif tautan unduhan telah berakhir (Expired).' };
    }

    if (download.downloadLimit > 0 && download.downloadCount >= download.downloadLimit) {
      return { 
        valid: false, 
        reason: `Batas kuota unduhan (${download.downloadLimit}x) telah habis. Silakan hubungi admin untuk reset limit.` 
      };
    }

    const order = db.orders.find(o => o.id === download.orderId);
    if (!order) {
      return { valid: false, reason: 'Pesanan terkait tidak ditemukan.' };
    }

    const product = db.products.find(p => p.id === download.productId);
    
    // Collect files: product files + any order bump files if purchased
    const files = [...(product?.files || [])];
    if (order.orderBumpAdded) {
      // Add bump files if available
      files.push({
        id: 'bump_bonus_file',
        productId: product?.id || '',
        fileName: 'Bonus_Dynamic_Blocks_Mega_Pack_2026.zip',
        fileSizeBytes: 480000000,
        mimeType: 'application/zip',
        storagePath: 'vault/bonus/Dynamic_Blocks.zip',
        fileType: 'ZIP',
        version: '1.0',
        accessInstructions: 'Ekstrak dan load melalui DesignCenter (Ctrl+2) di AutoCAD.'
      });
    }

    return {
      valid: true,
      download,
      order,
      product,
      files
    };
  }

  /**
   * Record a download event and increment count
   */
  public static recordDownload(token: string, fileId: string, ipAddress: string = '127.0.0.1') {
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) return;

    download.downloadCount += 1;
    download.downloadLogs.push({
      id: 'log_' + crypto.randomBytes(6).toString('hex'),
      fileId,
      fileName: 'File_' + fileId,
      downloadedAt: new Date().toISOString(),
      ipAddress
    });

    const order = db.orders.find(o => o.id === download.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'File Diunduh oleh Customer',
        description: `Customer mengunduh file (Unduhan ke-${download.downloadCount}). IP: ${ipAddress}`,
        timestamp: new Date().toISOString(),
        actor: 'CUSTOMER',
        metadata: { fileId, downloadCount: download.downloadCount }
      });
    }

    db.saveToFile();
  }

  /**
   * Reset download quota for a token back to 0
   */
  public static resetDownloadQuota(token: string, adminName: string = 'Admin'): { success: boolean; message: string; download?: SecureDownload } {
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) {
      return { success: false, message: 'Token unduhan tidak ditemukan.' };
    }

    const previousCount = download.downloadCount;
    download.downloadCount = 0;
    download.isRevoked = false;

    const order = db.orders.find(o => o.id === download.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Batas Kuota Unduhan Direset',
        description: `Admin ${adminName} mereset kuota unduhan (sebelumnya ${previousCount}/${download.downloadLimit}). Kuota kini kembali utuh 0/${download.downloadLimit}.`,
        timestamp: new Date().toISOString(),
        actor: 'ADMIN'
      });
    }

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: adminName,
      userRole: 'SUPER_ADMIN',
      action: 'RESET_DOWNLOAD_QUOTA',
      targetType: 'DOWNLOAD',
      targetId: download.id,
      details: `Mereset kuota unduhan token ${token} untuk order ${order?.orderNumber || '-'}`,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    return { success: true, message: 'Kuota unduhan berhasil di-reset menjadi 0.', download };
  }

  /**
   * Toggle revocation state of download link
   */
  public static toggleRevoke(token: string, adminName: string = 'Admin'): { success: boolean; isRevoked: boolean; message: string } {
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) {
      return { success: false, isRevoked: false, message: 'Token unduhan tidak ditemukan.' };
    }

    download.isRevoked = !download.isRevoked;
    const order = db.orders.find(o => o.id === download.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: download.isRevoked ? 'Akses Unduhan Dicabut (Revoked)' : 'Akses Unduhan Diaktifkan Kembali',
        description: `Admin ${adminName} ${download.isRevoked ? 'mencabut akses' : 'mengaktifkan kembali akses'} unduhan digital untuk order ini.`,
        timestamp: new Date().toISOString(),
        actor: 'ADMIN'
      });
    }

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: adminName,
      userRole: 'SUPER_ADMIN',
      action: download.isRevoked ? 'REVOKE_DOWNLOAD_ACCESS' : 'RESTORE_DOWNLOAD_ACCESS',
      targetType: 'DOWNLOAD',
      targetId: download.id,
      details: `${download.isRevoked ? 'Mencabut' : 'Memulihkan'} akses tautan unduhan ${token}`,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    return { 
      success: true, 
      isRevoked: download.isRevoked, 
      message: download.isRevoked ? 'Akses unduhan berhasil dinonaktifkan (revoked).' : 'Akses unduhan berhasil diaktifkan kembali.' 
    };
  }

  /**
   * Extend expiration date by N days
   */
  public static extendExpiry(token: string, additionalDays: number = 30, adminName: string = 'Admin'): { success: boolean; newExpiresAt: string; message: string } {
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) {
      return { success: false, newExpiresAt: '', message: 'Token unduhan tidak ditemukan.' };
    }

    const currentExpiry = new Date(download.tokenExpiresAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiresAt = new Date(baseTime + additionalDays * 86400000).toISOString();
    download.tokenExpiresAt = newExpiresAt;

    const order = db.orders.find(o => o.id === download.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Masa Aktif Tautan Diperpanjang',
        description: `Masa aktif tautan diperpanjang +${additionalDays} hari hingga ${new Date(newExpiresAt).toLocaleDateString('id-ID')}.`,
        timestamp: new Date().toISOString(),
        actor: 'ADMIN'
      });
    }

    db.saveToFile();
    return { 
      success: true, 
      newExpiresAt, 
      message: `Masa berlaku berhasil diperpanjang hingga ${new Date(newExpiresAt).toLocaleDateString('id-ID')}.` 
    };
  }

  /**
   * Verify license key status
   */
  public static verifyLicense(licenseKeyString: string): {
    valid: boolean;
    reason?: string;
    license?: LicenseKey;
    productName?: string;
    customerEmail?: string;
  } {
    const cleanKey = licenseKeyString.trim().toUpperCase();
    const license = db.licenses.find(l => l.licenseKey.toUpperCase() === cleanKey);
    if (!license) {
      return { valid: false, reason: 'License key tidak terdaftar atau tidak valid.' };
    }

    if (license.status === 'REVOKED') {
      return { valid: false, reason: 'License key ini telah dicabut atau dinonaktifkan oleh administrator.' };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return { valid: false, reason: 'Masa aktif license key telah berakhir.' };
    }

    const order = db.orders.find(o => o.id === license.orderId);
    const product = db.products.find(p => p.id === license.productId);

    return {
      valid: true,
      license,
      productName: product?.name || 'Produk Ruang Proyek',
      customerEmail: order?.customerEmail
    };
  }

  /**
   * Activate license key for a device/domain
   */
  public static activateLicense(licenseKeyString: string, deviceName: string = 'Desktop Device', ipAddress: string = '127.0.0.1'): {
    success: boolean;
    message: string;
    activationsRemaining?: number;
    license?: LicenseKey;
  } {
    const cleanKey = licenseKeyString.trim().toUpperCase();
    const license = db.licenses.find(l => l.licenseKey.toUpperCase() === cleanKey);
    if (!license) {
      return { success: false, message: 'License key tidak ditemukan.' };
    }

    if (license.status !== 'ACTIVE') {
      return { success: false, message: `License key tidak aktif (Status: ${license.status}).` };
    }

    if (license.activatedCount >= license.activationLimit) {
      return { 
        success: false, 
        message: `Batas aktivasi (${license.activationLimit} perangkat) telah tercapai. Hubungi admin untuk reset aktivasi.` 
      };
    }

    if (!license.activations) {
      license.activations = [];
    }

    const activationId = 'act_' + crypto.randomBytes(6).toString('hex');
    license.activatedCount += 1;
    license.activations.push({
      id: activationId,
      deviceName,
      ipAddress,
      activatedAt: new Date().toISOString()
    });

    const order = db.orders.find(o => o.id === license.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Lisensi Diaktivasi pada Perangkat Baru',
        description: `License key ${cleanKey} diaktivasi pada "${deviceName}" (${ipAddress}). Sisa kuota aktivasi: ${license.activationLimit - license.activatedCount}.`,
        timestamp: new Date().toISOString(),
        actor: 'CUSTOMER'
      });
    }

    db.saveToFile();

    return {
      success: true,
      message: `Aktivasi berhasil untuk ${deviceName}!`,
      activationsRemaining: Math.max(0, license.activationLimit - license.activatedCount),
      license
    };
  }

  /**
   * Reset activations for license key
   */
  public static resetLicenseActivations(licenseIdOrKey: string, adminName: string = 'Admin'): { success: boolean; message: string } {
    const license = db.licenses.find(l => l.id === licenseIdOrKey || l.licenseKey === licenseIdOrKey);
    if (!license) {
      return { success: false, message: 'Lisensi tidak ditemukan.' };
    }

    license.activatedCount = 0;
    license.activations = [];
    license.status = 'ACTIVE';

    const order = db.orders.find(o => o.id === license.orderId);
    if (order) {
      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Aktivasi Lisensi Direset oleh Admin',
        description: `Admin ${adminName} mereset seluruh aktivasi perangkat untuk lisensi ${license.licenseKey}.`,
        timestamp: new Date().toISOString(),
        actor: 'ADMIN'
      });
    }

    db.saveToFile();
    return { success: true, message: 'Daftar aktivasi lisensi berhasil di-reset.' };
  }
}
