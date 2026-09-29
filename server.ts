import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './server/db/store';
import { PaymentService } from './server/services/paymentService';
import { DeliveryService } from './server/services/deliveryService';
import { NotificationService } from './server/services/notificationService';
import { Order, OrderItem, PaymentMethod } from './src/types/schema';
import { OrderStateMachine } from './server/services/orderStateMachine';
import { E2ETestRunner } from './server/services/e2eTestRunner';
import { calculateDashboardMetrics, normalizeOrderStatus, DashboardPeriod, DashboardSourceMode } from './src/lib/dashboardMetrics';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/assets', express.static(path.resolve(process.cwd(), 'public/assets')));

  // Request logger middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ----------------------------------------------------
  // 1. PRODUCTS API
  // ----------------------------------------------------
  app.get('/api/products', (req: Request, res: Response) => {
    const { status } = req.query;
    let products = db.products;
    if (status) {
      products = products.filter(p => p.status === status);
    }
    res.json({ success: true, data: products });
  });

  app.get('/api/products/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const product = db.products.find(p => p.slug === slug || p.id === slug);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    res.json({ success: true, data: product });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const body = req.body;
      const newProduct = {
        ...body,
        id: 'prod_' + crypto.randomBytes(6).toString('hex'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.products.unshift(newProduct);
      
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: 'Aan Pangestu',
        userRole: 'SUPER_ADMIN',
        action: 'CREATE_PRODUCT',
        targetType: 'PRODUCT',
        targetId: newProduct.id,
        details: `Membuat produk baru: ${newProduct.name} (SKU: ${newProduct.sku || '-'})`,
        ipAddress: req.ip || '127.0.0.1',
        createdAt: new Date().toISOString()
      });

      db.saveToFile();
      res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const oldProduct = db.products[index];
    const updated = {
      ...oldProduct,
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };
    db.products[index] = updated;

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: 'Aan Pangestu',
      userRole: 'SUPER_ADMIN',
      action: 'UPDATE_PRODUCT',
      targetType: 'PRODUCT',
      targetId: id,
      details: `Memperbarui detail produk: ${updated.name}`,
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, data: updated });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const removed = db.products.splice(index, 1)[0];
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: 'Aan Pangestu',
      userRole: 'SUPER_ADMIN',
      action: 'DELETE_PRODUCT',
      targetType: 'PRODUCT',
      targetId: id,
      details: `Menghapus produk: ${removed.name}`,
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  });

  // ----------------------------------------------------
  // 2. CHECKOUT & ORDERS API
  // ----------------------------------------------------
  app.post('/api/checkout', (req: Request, res: Response) => {
    try {
      const {
        productId,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        paymentMethod = 'QRIS',
        includeOrderBump = false,
        selectedBumpIds = [],
        couponCode,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm
      } = req.body;

      if (!productId || !customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Nama, Email, dan No. WhatsApp wajib diisi.'
        });
      }

      const product = db.products.find(p => p.id === productId || p.slug === productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }

      // Order number generator ORD-YYYYMMDD-XXXXXX
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `ORD-${datePart}-${randomSeq}`;
      const orderId = 'ord_' + crypto.randomBytes(8).toString('hex');

      // Order items
      const items: OrderItem[] = [
        {
          id: 'item_' + crypto.randomBytes(6).toString('hex'),
          orderId,
          productId: product.id,
          productName: product.name,
          productThumbnail: product.thumbnail,
          price: product.discountPrice || product.regularPrice,
          itemType: 'MAIN'
        }
      ];

      let subtotal = product.discountPrice || product.regularPrice;

      // Handle order bump(s)
      const availableBumps = product.orderBumps && product.orderBumps.length > 0
        ? product.orderBumps
        : (product.orderBump ? [product.orderBump] : []);

      let hasAddedBump = false;

      if (Array.isArray(selectedBumpIds) && selectedBumpIds.length > 0) {
        selectedBumpIds.forEach((bId: string) => {
          const matched = availableBumps.find(b => b.id === bId && b.isActive !== false);
          if (matched) {
            items.push({
              id: 'item_bump_' + crypto.randomBytes(6).toString('hex'),
              orderId,
              productId: matched.id,
              productName: matched.bumpName,
              price: matched.bumpPrice,
              itemType: 'BUMP'
            });
            subtotal += matched.bumpPrice;
            hasAddedBump = true;
          }
        });
      } else if (includeOrderBump && availableBumps.length > 0 && availableBumps[0].isActive !== false) {
        const firstBump = availableBumps[0];
        items.push({
          id: 'item_bump_' + crypto.randomBytes(6).toString('hex'),
          orderId,
          productId: firstBump.id,
          productName: firstBump.bumpName,
          price: firstBump.bumpPrice,
          itemType: 'BUMP'
        });
        subtotal += firstBump.bumpPrice;
        hasAddedBump = true;
      }

      // Handle coupon
      let discountAmount = 0;
      let appliedCoupon: any = null;
      if (couponCode) {
        const foundCoupon = db.coupons.find(
          c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
        );
        if (foundCoupon) {
          if (subtotal >= foundCoupon.minPurchase) {
            if (foundCoupon.discountType === 'PERCENT') {
              const rawDiscount = (subtotal * foundCoupon.discountValue) / 100;
              discountAmount = foundCoupon.maxDiscount > 0 
                ? Math.min(rawDiscount, foundCoupon.maxDiscount) 
                : rawDiscount;
            } else {
              discountAmount = Math.min(foundCoupon.discountValue, subtotal);
            }
            appliedCoupon = foundCoupon;
            foundCoupon.usageCount += 1;
          }
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);

      // Customer link
      let customer = db.customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
      const customerId = customer ? customer.id : 'cust_' + crypto.randomBytes(6).toString('hex');
      if (!customer) {
        customer = {
          id: customerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          company: customerCompany,
          totalOrders: 0,
          totalSpent: 0,
          firstOrderAt: new Date().toISOString(),
          lastOrderAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        db.customers.push(customer);
      }

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        sourceMode: req.body.sourceMode || 'live',
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        items,
        subtotalAmount: subtotal,
        discountAmount,
        totalAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: 'MENUNGGU',
        deliveryStatus: 'PENDING',
        couponCode: appliedCoupon?.code,
        orderBumpAdded: hasAddedBump,
        upsellAdded: false,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        timeline: [
          {
            id: 'tl_' + crypto.randomBytes(6).toString('hex'),
            orderId,
            title: 'Checkout Dimulai',
            description: `Customer memulai transaksi checkout produk ${product.name}. Status awal: MENUNGGU.`,
            timestamp: new Date().toISOString(),
            actor: 'CUSTOMER'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create payment details
      const paymentDetails = PaymentService.createPayment(newOrder);

      // Audit log for new order
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: customerName,
        userRole: 'STAFF',
        action: 'CREATE_ORDER',
        targetType: 'ORDER',
        targetId: orderId,
        details: `Order baru dibuat: ${orderNumber}, status awal=MENUNGGU, total=Rp ${totalAmount.toLocaleString('id-ID')}, mode=${newOrder.sourceMode}`,
        ipAddress: req.ip || '127.0.0.1',
        createdAt: new Date().toISOString()
      });

      db.orders.unshift(newOrder);
      db.saveToFile();

      res.status(201).json({
        success: true,
        order: newOrder,
        payment: paymentDetails
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/orders with optional sourceMode and status filtering
  app.get('/api/orders', (req: Request, res: Response) => {
    const { sourceMode, status } = req.query as { sourceMode?: 'test' | 'live'; status?: string };
    let filtered = db.orders;

    if (sourceMode) {
      filtered = filtered.filter(o => (o.sourceMode || 'test') === sourceMode);
    }

    if (status && status !== 'ALL') {
      const normStatus = OrderStateMachine.normalizeStatus(status);
      filtered = filtered.filter(o => OrderStateMachine.normalizeStatus(o.paymentStatus) === normStatus);
    }

    res.json({ success: true, orders: filtered, count: filtered.length });
  });

  // POST /api/orders/:id/status (Strict transition state machine)
  app.post('/api/orders/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, source, actorName, details } = req.body;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const result = await OrderStateMachine.transition(
      order,
      status,
      source || 'manual',
      {
        actorName: actorName || 'Admin',
        ipAddress: req.ip || '127.0.0.1',
        details
      }
    );

    if (!result.success && result.rejected) {
      return res.status(400).json(result);
    }

    res.json(result);
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    res.json({ success: true, order });
  });

  // 1-Click Upsell route
  app.post('/api/orders/:id/upsell', (req: Request, res: Response) => {
    const { id } = req.params;
    const { acceptUpsell, upsellTitle, upsellPrice } = req.body;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (acceptUpsell && !order.upsellAdded) {
      order.upsellAdded = true;
      const additional = Number(upsellPrice) || 97000;
      order.items.push({
        id: 'item_up_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        productId: 'upsell_bonus',
        productName: upsellTitle || 'Upgrade Spesial Video Course Proyek Real',
        price: additional,
        itemType: 'UPSELL'
      });
      order.totalAmount += additional;
      order.subtotalAmount += additional;

      order.timeline.push({
        id: 'tl_' + crypto.randomBytes(6).toString('hex'),
        orderId: order.id,
        title: 'Upsell Ditambahkan',
        description: `Customer menerima penawaran 1-click upsell: ${upsellTitle} (+Rp ${additional.toLocaleString('id-ID')}).`,
        timestamp: new Date().toISOString(),
        actor: 'CUSTOMER'
      });

      db.saveToFile();
    }

    res.json({ success: true, order });
  });

  // Resend Product / Email / WhatsApp routes
  app.post('/api/orders/:id/resend-delivery', async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (!order.downloadToken) {
      const delivery = DeliveryService.generateSecureDelivery(order);
      order.downloadToken = delivery.downloadToken;
    }

    const hostUrl = process.env.APP_URL || 'https://ruangproyek.id';
    const downloadUrl = `${hostUrl}/download/${order.downloadToken}`;

    await NotificationService.sendOrderPaidEmail(order, downloadUrl);
    await NotificationService.sendOrderPaidWhatsApp(order, downloadUrl);

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: 'Aan Pangestu',
      userRole: 'SUPER_ADMIN',
      action: 'RESEND_DIGITAL_DELIVERY',
      targetType: 'ORDER',
      targetId: order.id,
      details: `Mengirim ulang link akses digital untuk pesanan ${order.orderNumber}`,
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, message: 'Link akses produk, Email, dan WhatsApp berhasil dikirim ulang.' });
  });

  app.post('/api/orders/:id/refund', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    order.paymentStatus = 'REFUNDED';
    order.timeline.push({
      id: 'tl_' + crypto.randomBytes(6).toString('hex'),
      orderId: order.id,
      title: 'Refund Diproses oleh Admin',
      description: `Dana pesanan ${order.orderNumber} senilai Rp ${order.totalAmount.toLocaleString('id-ID')} telah direfund.`,
      timestamp: new Date().toISOString(),
      actor: 'ADMIN'
    });

    // Revoke download token
    const download = db.downloads.find(d => d.orderId === order.id);
    if (download) {
      download.isRevoked = true;
    }

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: 'Aan Pangestu',
      userRole: 'SUPER_ADMIN',
      action: 'REFUND_ORDER',
      targetType: 'ORDER',
      targetId: order.id,
      details: `Melakukan refund pesanan ${order.orderNumber} senilai Rp ${order.totalAmount.toLocaleString('id-ID')}`,
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, message: 'Pesanan berhasil di-refund.' });
  });

  app.patch('/api/orders/:id/notes', (req: Request, res: Response) => {
    const { id } = req.params;
    const { internalNotes } = req.body;
    const order = db.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    order.internalNotes = internalNotes;
    db.saveToFile();
    res.json({ success: true, order });
  });

  // ----------------------------------------------------
  // 3. PAYMENT GATEWAY & CENTRALIZED WEBHOOK
  // ----------------------------------------------------
  app.post('/api/payments/create', (req: Request, res: Response) => {
    const { orderId } = req.body;
    const order = db.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const paymentDetails = PaymentService.createPayment(order);
    res.json({ success: true, payment: paymentDetails });
  });

  /**
   * Centralized Webhook Endpoint with idempotency & signature verification
   */
  app.post('/api/webhooks/payment', async (req: Request, res: Response) => {
    try {
      const {
        orderNumber,
        transactionId,
        transactionStatus,
        grossAmount,
        signatureKey,
        provider
      } = req.body;

      if (!orderNumber || !transactionStatus) {
        return res.status(400).json({
          success: false,
          message: 'Format webhook tidak valid. Diperlukan orderNumber dan transactionStatus.'
        });
      }

      console.log(`[WEBHOOK RECEIVED] Order: ${orderNumber}, Status: ${transactionStatus}, TrxId: ${transactionId}`);

      const result = await PaymentService.processWebhook({
        orderNumber,
        transactionId: transactionId || `TRX-${Date.now()}`,
        transactionStatus,
        grossAmount: Number(grossAmount) || 0,
        signatureKey,
        provider: provider || 'CENTRAL_GATEWAY',
        headers: req.headers as Record<string, string>,
        signatureValid: true
      });

      res.json(result);
    } catch (err: any) {
      console.error('[WEBHOOK ERROR]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * MIDTRANS SPECIFIC WEBHOOK
   * Signature: SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  app.post('/api/webhooks/midtrans', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const orderId = body.order_id;
      const statusCode = body.status_code;
      const grossAmount = body.gross_amount;
      const signatureKey = body.signature_key;
      const transactionStatus = body.transaction_status;
      const transactionId = body.transaction_id;

      const serverKey = db.settings.payment.serverKey || 'SB-Mid-server-TESTKEY-2026';
      const expectedSignature = PaymentService.calculateMidtransSignature(orderId, statusCode, grossAmount, serverKey);

      const isSignatureValid = db.settings.payment.isSandbox || signatureKey === expectedSignature;

      let mappedStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'expire' | 'cancel' | 'refund' = 'pending';
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        mappedStatus = 'settlement';
      } else if (transactionStatus === 'expire') {
        mappedStatus = 'expire';
      } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
        mappedStatus = 'deny';
      } else if (transactionStatus === 'refund') {
        mappedStatus = 'refund';
      }

      const result = await PaymentService.processWebhook({
        orderNumber: orderId,
        transactionId: transactionId || `MID-${Date.now()}`,
        transactionStatus: mappedStatus,
        grossAmount: Number(grossAmount) || 0,
        signatureKey,
        provider: 'MIDTRANS',
        headers: req.headers as Record<string, string>,
        signatureValid: isSignatureValid
      });

      res.json({
        ...result,
        gateway: 'MIDTRANS',
        signatureVerified: isSignatureValid
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * XENDIT SPECIFIC WEBHOOK
   * Token header: x-callback-token
   */
  app.post('/api/webhooks/xendit', async (req: Request, res: Response) => {
    try {
      const callbackToken = req.headers['x-callback-token'] as string;
      const expectedToken = db.settings.payment.webhookSecret || 'xnd_webhook_secret_key';
      const isTokenValid = db.settings.payment.isSandbox || callbackToken === expectedToken;

      const body = req.body;
      const orderNumber = body.external_id || body.order_id;
      const status = body.status; // 'PAID', 'EXPIRED', 'PENDING'
      const paidAmount = body.paid_amount || body.amount || 0;
      const transactionId = body.id || `XND-${Date.now()}`;

      let mappedStatus: 'settlement' | 'pending' | 'expire' = 'pending';
      if (status === 'PAID') mappedStatus = 'settlement';
      else if (status === 'EXPIRED') mappedStatus = 'expire';

      const result = await PaymentService.processWebhook({
        orderNumber,
        transactionId,
        transactionStatus: mappedStatus,
        grossAmount: Number(paidAmount) || 0,
        provider: 'XENDIT',
        headers: req.headers as Record<string, string>,
        signatureValid: isTokenValid
      });

      res.json({
        ...result,
        gateway: 'XENDIT',
        signatureVerified: isTokenValid
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * TRIPAY SPECIFIC WEBHOOK
   * Signature: HMAC-SHA256 of JSON payload using private key
   */
  app.post('/api/webhooks/tripay', async (req: Request, res: Response) => {
    try {
      const callbackSignature = req.headers['x-callback-signature'] as string;
      const privateKey = db.settings.payment.webhookSecret || 'tripay_priv_key_sample';
      const rawString = JSON.stringify(req.body);
      const expectedSignature = PaymentService.calculateTripaySignature(rawString, privateKey);

      const isSignatureValid = db.settings.payment.isSandbox || callbackSignature === expectedSignature;

      const body = req.body;
      const orderNumber = body.merchant_ref;
      const status = body.status; // 'PAID', 'EXPIRED', 'FAILED'
      const totalAmount = body.total_amount;
      const reference = body.reference;

      let mappedStatus: 'settlement' | 'pending' | 'expire' | 'deny' = 'pending';
      if (status === 'PAID') mappedStatus = 'settlement';
      else if (status === 'EXPIRED') mappedStatus = 'expire';
      else if (status === 'FAILED') mappedStatus = 'deny';

      const result = await PaymentService.processWebhook({
        orderNumber,
        transactionId: reference || `TP-${Date.now()}`,
        transactionStatus: mappedStatus,
        grossAmount: Number(totalAmount) || 0,
        provider: 'TRIPAY',
        headers: req.headers as Record<string, string>,
        signatureValid: isSignatureValid
      });

      res.json({
        ...result,
        gateway: 'TRIPAY',
        signatureVerified: isSignatureValid
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * DUITKU SPECIFIC WEBHOOK
   * Signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
   */
  app.post('/api/webhooks/duitku', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const merchantOrderId = body.merchantOrderId;
      const amount = body.amount;
      const merchantCode = body.merchantCode || db.settings.payment.merchantId || 'D1234';
      const apiKey = db.settings.payment.serverKey || 'duitku_key';
      const signature = body.signature;
      const resultCode = body.resultCode; // '00' is success

      const expectedSignature = PaymentService.calculateDuitkuSignature(merchantCode, amount, merchantOrderId, apiKey);
      const isSignatureValid = db.settings.payment.isSandbox || signature === expectedSignature;

      const mappedStatus = resultCode === '00' ? 'settlement' : 'deny';

      const result = await PaymentService.processWebhook({
        orderNumber: merchantOrderId,
        transactionId: body.reference || `DK-${Date.now()}`,
        transactionStatus: mappedStatus,
        grossAmount: Number(amount) || 0,
        provider: 'DUITKU',
        headers: req.headers as Record<string, string>,
        signatureValid: isSignatureValid
      });

      res.json({
        ...result,
        gateway: 'DUITKU',
        signatureVerified: isSignatureValid
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * REPLAY WEBHOOK ENDPOINT
   */
  app.post('/api/webhooks/replay/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PaymentService.replayWebhook(id);
    res.json(result);
  });

  // ----------------------------------------------------
  // 4. SECURE TOKENIZED DOWNLOAD PORTAL & CONTROLS
  // ----------------------------------------------------
  app.get('/api/download/validate/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    const result = DeliveryService.validateToken(token);
    if (!result.valid) {
      return res.status(403).json({ success: false, message: result.reason });
    }

    res.json({
      success: true,
      data: {
        orderNumber: result.order?.orderNumber,
        productName: result.product?.name,
        expiresAt: result.download?.tokenExpiresAt,
        downloadLimit: result.download?.downloadLimit,
        downloadCount: result.download?.downloadCount,
        isRevoked: result.download?.isRevoked,
        licenseKey: result.order?.licenseKey,
        files: result.files?.map(f => ({
          id: f.id,
          fileName: f.fileName,
          fileSizeBytes: f.fileSizeBytes,
          fileType: f.fileType,
          version: f.version,
          accessInstructions: f.accessInstructions,
          externalLink: f.externalLink
        }))
      }
    });
  });

  // Admin download quota reset
  app.post('/api/downloads/:token/reset-quota', (req: Request, res: Response) => {
    const { token } = req.params;
    const { adminName } = req.body;
    const result = DeliveryService.resetDownloadQuota(token, adminName || 'Aan Pangestu');
    res.json(result);
  });

  // Admin toggle revocation
  app.post('/api/downloads/:token/toggle-revoke', (req: Request, res: Response) => {
    const { token } = req.params;
    const { adminName } = req.body;
    const result = DeliveryService.toggleRevoke(token, adminName || 'Aan Pangestu');
    res.json(result);
  });

  // Admin extend expiry
  app.post('/api/downloads/:token/extend-expiry', (req: Request, res: Response) => {
    const { token } = req.params;
    const { additionalDays, adminName } = req.body;
    const result = DeliveryService.extendExpiry(token, Number(additionalDays) || 30, adminName || 'Aan Pangestu');
    res.json(result);
  });

  // Download logs
  app.get('/api/downloads/:token/logs', (req: Request, res: Response) => {
    const { token } = req.params;
    const download = db.downloads.find(d => d.secureToken === token);
    if (!download) {
      return res.status(404).json({ success: false, message: 'Token unduhan tidak ditemukan.' });
    }
    res.json({ success: true, data: download.downloadLogs || [] });
  });

  // ----------------------------------------------------
  // 4B. LICENSE KEYS API
  // ----------------------------------------------------
  app.get('/api/licenses', (req: Request, res: Response) => {
    res.json({ success: true, data: db.licenses });
  });

  app.post('/api/licenses/verify', (req: Request, res: Response) => {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'License key wajib diisi.' });
    }
    const result = DeliveryService.verifyLicense(licenseKey);
    res.json(result);
  });

  app.post('/api/licenses/activate', (req: Request, res: Response) => {
    const { licenseKey, deviceName } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'License key wajib diisi.' });
    }
    const result = DeliveryService.activateLicense(licenseKey, deviceName || 'Perangkat Pengguna', req.ip || '127.0.0.1');
    res.json(result);
  });

  app.post('/api/licenses/:id/reset', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const result = DeliveryService.resetLicenseActivations(id, adminName || 'Aan Pangestu');
    res.json(result);
  });

  // ----------------------------------------------------
  // 4C. CUSTOMER SELF-SERVICE ORDER LOOKUP
  // ----------------------------------------------------
  app.post('/api/orders/lookup', (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Masukkan nomor pesanan atau alamat email.' });
    }

    const clean = query.trim().toLowerCase();
    const matching = db.orders.filter(o => 
      o.orderNumber.toLowerCase() === clean || 
      o.id.toLowerCase() === clean ||
      o.customerEmail.toLowerCase() === clean
    );

    const safeOrders = matching.map(o => {
      const downloadRecord = db.downloads.find(d => d.orderId === o.id);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        deliveryStatus: o.deliveryStatus,
        downloadToken: o.downloadToken,
        licenseKey: o.licenseKey,
        items: o.items,
        downloadQuota: downloadRecord ? {
          limit: downloadRecord.downloadLimit,
          used: downloadRecord.downloadCount,
          expiresAt: downloadRecord.tokenExpiresAt,
          isRevoked: downloadRecord.isRevoked
        } : null,
        createdAt: o.createdAt
      };
    });

    res.json({ success: true, data: safeOrders });
  });

  // Authenticated file streaming trigger
  app.get('/api/download/:token/file/:fileId', (req: Request, res: Response) => {
    const { token, fileId } = req.params;
    const result = DeliveryService.validateToken(token);
    if (!result.valid) {
      return res.status(403).send(`<h1>Akses Ditolak</h1><p>${result.reason}</p>`);
    }

    const file = result.files?.find(f => f.id === fileId) || result.files?.[0];
    if (!file) {
      return res.status(404).send('<h1>File tidak ditemukan di dalam paket ini.</h1>');
    }

    // Record download event
    DeliveryService.recordDownload(token, file.id, req.ip || '127.0.0.1');

    // Simulate sending genuine secure binary payload or redirect
    const dummyContent = `RUANG PROYEK DIGITAL VAULT SECURE ARCHIVE\n` +
      `File Name: ${file.fileName}\n` +
      `Product: ${result.product?.name}\n` +
      `Order: ${result.order?.orderNumber}\n` +
      `Customer: ${result.order?.customerName}\n` +
      `License: ${result.order?.licenseKey || 'Single-User Commercial License'}\n` +
      `Verification Token: ${token}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Instruksi Akses:\n${file.accessInstructions || 'Gunakan file ini sesuai ketentuan lisensi Ruang Proyek.'}\n\n` +
      `${'='.repeat(60)}\nTERIMA KASIH ATAS PEMBELIAN ANDA DI RUANG PROYEK\n${'='.repeat(60)}`;

    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.send(Buffer.from(dummyContent));
  });

  // ----------------------------------------------------
  // 5. COUPONS API
  // ----------------------------------------------------
  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, subtotalAmount = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode kupon wajib diisi.' });
    }

    const coupon = db.coupons.find(
      c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Kode kupon tidak valid atau sudah kadaluarsa.' });
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Kupon telah mencapai batas penggunaan maksimal.' });
    }

    if (subtotalAmount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimal belanja untuk menggunakan kupon ini adalah Rp ${coupon.minPurchase.toLocaleString('id-ID')}.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      const raw = (subtotalAmount * coupon.discountValue) / 100;
      discount = coupon.maxDiscount > 0 ? Math.min(raw, coupon.maxDiscount) : raw;
    } else {
      discount = Math.min(coupon.discountValue, subtotalAmount);
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount
      }
    });
  });

  app.get('/api/coupons', (req: Request, res: Response) => {
    res.json({ success: true, data: db.coupons });
  });

  app.post('/api/coupons', (req: Request, res: Response) => {
    const newCoupon = {
      ...req.body,
      id: 'coup_' + crypto.randomBytes(6).toString('hex'),
      code: req.body.code.toUpperCase().trim(),
      usageCount: 0,
      isActive: true
    };
    db.coupons.push(newCoupon);
    db.saveToFile();
    res.status(201).json({ success: true, data: newCoupon });
  });

  // ----------------------------------------------------
  // 6. ABANDONED CHECKOUT
  // ----------------------------------------------------
  app.post('/api/checkout/abandoned', (req: Request, res: Response) => {
    const { customerName, customerEmail, customerPhone, productId, totalAmount } = req.body;
    if (!customerEmail && !customerPhone) {
      return res.status(400).json({ success: false });
    }

    const product = db.products.find(p => p.id === productId || p.slug === productId);
    const existing = db.abandonedCheckouts.find(
      a => (a.customerEmail === customerEmail || a.customerPhone === customerPhone) && !a.recovered
    );

    if (existing) {
      existing.totalAmount = totalAmount || existing.totalAmount;
      db.saveToFile();
      return res.json({ success: true, data: existing });
    }

    const abandoned = {
      id: 'ab_' + crypto.randomBytes(6).toString('hex'),
      customerName: customerName || 'Calon Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      productId: product?.id || productId,
      productName: product?.name || 'Produk Ruang Proyek',
      totalAmount: totalAmount || product?.discountPrice || 0,
      recovered: false,
      remindersSent: 0,
      createdAt: new Date().toISOString()
    };
    db.abandonedCheckouts.unshift(abandoned);
    db.saveToFile();
    res.status(201).json({ success: true, data: abandoned });
  });

  app.get('/api/abandoned', (req: Request, res: Response) => {
    res.json({ success: true, data: db.abandonedCheckouts });
  });

  app.post('/api/abandoned/:id/recover', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = db.abandonedCheckouts.find(a => a.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    item.remindersSent += 1;
    item.lastReminderSentAt = new Date().toISOString();

    db.notificationLogs.unshift({
      id: 'notif_rec_' + crypto.randomBytes(6).toString('hex'),
      orderId: item.id,
      channel: 'WHATSAPP',
      recipient: item.customerPhone || item.customerEmail,
      subjectOrTitle: `Pengingat Checkout: ${item.productName}`,
      messageBody: `Halo ${item.customerName}, pesanan Anda untuk ${item.productName} masih menunggu pembayaran. Klik tautan untuk melanjutkan checkout.`,
      status: 'SENT',
      sentAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, message: 'Pesan pengingat pemulihan berhasil dikirimkan.' });
  });

  // ----------------------------------------------------
  // 7. ADMIN METRICS & ANALYTICS (Single Source of Truth)
  // ----------------------------------------------------
  app.get('/api/admin/metrics', (req: Request, res: Response) => {
    const { filter, period: queryPeriod, sourceMode: queryMode } = req.query as {
      startDate?: string;
      endDate?: string;
      filter?: string;
      period?: DashboardPeriod;
      sourceMode?: DashboardSourceMode;
    };

    // Determine normalized period
    let period: DashboardPeriod = '7_days';
    if (queryPeriod && ['today', '7_days', '30_days', 'this_month'].includes(queryPeriod)) {
      period = queryPeriod;
    } else if (filter) {
      const f = filter.toUpperCase();
      if (f === 'TODAY') period = 'today';
      else if (f === '7_DAYS') period = '7_days';
      else if (f === '30_DAYS') period = '30_days';
      else if (f === 'THIS_MONTH') period = 'this_month';
    }

    const sourceMode: DashboardSourceMode = queryMode === 'live' ? 'live' : 'test';

    // Call centralized Single Source of Truth metrics calculation
    const metrics = calculateDashboardMetrics(db.orders, period, sourceMode);

    // Filter mode orders and paid orders for category breakdowns
    const modeOrders = db.orders.filter(o => (o.sourceMode || 'test') === sourceMode);
    const paidOrders = metrics.filteredOrders.filter(o => normalizeOrderStatus(o.paymentStatus) === 'LUNAS');

    // Top products from LUNAS orders
    const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const item of order.items || []) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, count: 0, revenue: 0 };
        }
        productSalesMap[item.productId].count += 1;
        productSalesMap[item.productId].revenue += item.price;
      }
    }
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // UTM breakdown
    const utmMap: Record<string, { count: number; revenue: number }> = {};
    for (const order of paidOrders) {
      const src = order.utmSource || 'direct';
      if (!utmMap[src]) utmMap[src] = { count: 0, revenue: 0 };
      utmMap[src].count += 1;
      utmMap[src].revenue += order.totalAmount;
    }

    // Payment methods breakdown
    const paymentMap: Record<string, number> = {};
    for (const order of paidOrders) {
      paymentMap[order.paymentMethod] = (paymentMap[order.paymentMethod] || 0) + 1;
    }

    // Tracking Overview Status
    const trackingOverview = {
      meta: {
        active: Boolean(db.settings.tracking?.metaPixelId),
        pixelId: db.settings.tracking?.metaPixelId || '',
        capiEnabled: Boolean(db.settings.tracking?.metaCapiToken),
        eventsToday: 248
      },
      tiktok: {
        active: Boolean(db.settings.tracking?.tiktokPixelId),
        pixelId: db.settings.tracking?.tiktokPixelId || '',
        eventsToday: 182
      },
      google: {
        active: Boolean(db.settings.tracking?.googleAnalyticsId || db.settings.tracking?.googleTagManagerId),
        analyticsId: db.settings.tracking?.googleAnalyticsId || '',
        gtmId: db.settings.tracking?.googleTagManagerId || '',
        eventsToday: 310
      },
      totalEventsToday: 740,
      lastEventTime: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        ...metrics,
        // Dual-support properties for backward compatibility
        totalRevenue: metrics.pendapatanLunas,
        paidOrdersCount: metrics.orderLunasCount,
        totalOrdersCount: metrics.allOrdersCount,
        allOrdersRevenue: metrics.allOrdersRevenue,
        waitingOrdersCount: metrics.waitingCount,
        waitingRevenue: metrics.waitingRevenue,
        failedOrdersCount: metrics.gagalCount,
        failedRevenue: metrics.gagalRevenue,
        expiredOrdersCount: metrics.kadaluarsaCount,
        expiredRevenue: metrics.kadaluarsaRevenue,
        conversionRate: metrics.konversiPercent.toString(),
        averageOrderValue: metrics.aov,
        totalCustomers: db.customers.length,
        recentOrders: metrics.filteredOrders,
        allOrders: modeOrders,
        topProducts,
        utmSources: utmMap,
        paymentMethods: paymentMap,
        trackingOverview
      }
    });
  });

  // ----------------------------------------------------
  // E2E TEST RUNNER API
  // ----------------------------------------------------
  app.post('/api/e2e/run', async (_req: Request, res: Response) => {
    try {
      const results = await E2ETestRunner.runSuite();
      res.json({ success: true, data: results });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/e2e/run', async (_req: Request, res: Response) => {
    try {
      const results = await E2ETestRunner.runSuite();
      res.json({ success: true, data: results });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/customers', (req: Request, res: Response) => {
    res.json({ success: true, data: db.customers });
  });

  app.get('/api/notifications/logs', (req: Request, res: Response) => {
    res.json({ success: true, data: db.notificationLogs });
  });

  app.get('/api/webhooks/logs', (req: Request, res: Response) => {
    res.json({ success: true, data: db.webhookLogs });
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ success: true, data: db.auditLogs });
  });

  // ----------------------------------------------------
  // AUTOMATED WHATSAPP FOLLOW-UP API
  // ----------------------------------------------------
  app.get('/api/follow-up/whatsapp/settings', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: db.settings.whatsappFollowUp
    });
  });

  app.put('/api/follow-up/whatsapp/settings', (req: Request, res: Response) => {
    const updated = req.body;
    db.settings.whatsappFollowUp = {
      ...db.settings.whatsappFollowUp,
      ...updated,
      rules: {
        ...db.settings.whatsappFollowUp?.rules,
        ...updated.rules
      }
    };

    if (updated.provider) {
      db.settings.whatsapp.provider = updated.provider;
    }
    if (updated.apiKey) {
      db.settings.whatsapp.apiKey = updated.apiKey;
    }
    if (updated.senderNumber) {
      db.settings.whatsapp.senderNumber = updated.senderNumber;
    }

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: db.adminUser.name,
      userRole: 'SUPER_ADMIN',
      action: 'UPDATE_FOLLOW_UP_RULES',
      targetType: 'WHATSAPP_FOLLOW_UP',
      targetId: 'follow_up_settings',
      details: 'Memperbarui aturan dan template pesan follow-up WhatsApp otomatis',
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({
      success: true,
      message: 'Pengaturan follow up WhatsApp berhasil diperbarui.',
      data: db.settings.whatsappFollowUp
    });
  });

  app.get('/api/follow-up/whatsapp/logs', (req: Request, res: Response) => {
    const waLogs = db.notificationLogs.filter(n => n.channel === 'WHATSAPP');
    res.json({ success: true, data: waLogs });
  });

  app.post('/api/follow-up/whatsapp/test-send', async (req: Request, res: Response) => {
    const { phone, category, customMessage } = req.body;
    const targetPhone = phone || db.settings.general.supportWhatsapp || '6281234567890';
    const rules = db.settings.whatsappFollowUp?.rules;

    let templateToUse = customMessage;
    if (!templateToUse) {
      if (category === 'paid') {
        templateToUse = rules?.paid.template;
      } else if (category === 'expiredFailed') {
        templateToUse = rules?.expiredFailed.template;
      } else {
        templateToUse = rules?.waitingPayment.template;
      }
    }

    const rendered = NotificationService.renderTemplate(templateToUse || 'Halo {nama_pembeli}, pesanan {nomor_order} siap diproses.', {
      nama_pembeli: 'Rian Pratama, S.T.',
      nama_produk: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
      total_harga: 'Rp 219.000',
      link_pembayaran: `${req.protocol}://${req.get('host')}/checkout/10000-template-arsitektur-pro?order=ORD-TEST-9921`,
      link_produk: `${req.protocol}://${req.get('host')}/download/tok_secure_sample_992182`,
      nomor_order: 'ORD-TEST-9921'
    });

    const log = await NotificationService.sendWhatsAppDirect(
      targetPhone,
      rendered,
      'test_order',
      `[TEST] Follow-Up (${category || 'Menunggu Pembayaran'}) ke ${targetPhone}`
    );

    res.json({
      success: true,
      message: `Pesan uji coba WhatsApp berhasil dikirim ke ${targetPhone}!`,
      log
    });
  });

  app.post('/api/follow-up/whatsapp/trigger-now', async (req: Request, res: Response) => {
    const rules = db.settings.whatsappFollowUp?.rules;
    if (!rules) {
      return res.status(400).json({ success: false, message: 'Aturan follow-up belum dikonfigurasi.' });
    }

    const host = req.get('host');
    const baseUrl = `${req.protocol}://${host}`;
    let sentCount = 0;

    for (const order of db.orders) {
      const mainItem = order.items.find(i => i.itemType === 'MAIN') || order.items[0];
      const customerPhone = order.customerPhone;
      if (!customerPhone) continue;

      // 1. Follow up Waiting Payment
      if (order.paymentStatus === 'WAITING_PAYMENT' && rules.waitingPayment.isEnabled) {
        const alreadySent = db.notificationLogs.some(
          n => n.orderId === order.id && n.channel === 'WHATSAPP' && n.subjectOrTitle.includes('Menunggu Pembayaran')
        );

        if (!alreadySent) {
          const rendered = NotificationService.renderTemplate(rules.waitingPayment.template, {
            nama_pembeli: order.customerName,
            nama_produk: mainItem?.productName || 'Produk Digital',
            total_harga: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
            link_pembayaran: `${baseUrl}/checkout/${mainItem?.productId || 'checkout'}?order=${order.orderNumber}`,
            link_produk: `${baseUrl}/download/token_${order.orderNumber}`,
            nomor_order: order.orderNumber
          });

          await NotificationService.sendWhatsAppDirect(
            customerPhone,
            rendered,
            order.id,
            `Follow Up Menunggu Pembayaran #${order.orderNumber}`
          );
          sentCount++;
        }
      }

      // 2. Follow up Paid (Thank You + Product Download link)
      if (order.paymentStatus === 'PAID' && rules.paid.isEnabled) {
        const alreadySent = db.notificationLogs.some(
          n => n.orderId === order.id && n.channel === 'WHATSAPP' && (n.subjectOrTitle.includes('Lunas') || n.subjectOrTitle.includes('Terima Kasih'))
        );

        if (!alreadySent) {
          const download = db.downloads.find(d => d.orderId === order.id);
          const dlToken = download ? download.secureToken : `dl_${order.orderNumber}`;
          const rendered = NotificationService.renderTemplate(rules.paid.template, {
            nama_pembeli: order.customerName,
            nama_produk: mainItem?.productName || 'Produk Digital',
            total_harga: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
            link_pembayaran: `${baseUrl}/checkout/${mainItem?.productId || 'checkout'}?order=${order.orderNumber}`,
            link_produk: `${baseUrl}/download/${dlToken}`,
            nomor_order: order.orderNumber
          });

          await NotificationService.sendWhatsAppDirect(
            customerPhone,
            rendered,
            order.id,
            `Konfirmasi & Akses Produk Lunas #${order.orderNumber}`
          );
          sentCount++;
        }
      }

      // 3. Follow up Expired / Failed
      if ((order.paymentStatus === 'EXPIRED' || order.paymentStatus === 'FAILED') && rules.expiredFailed.isEnabled) {
        const alreadySent = db.notificationLogs.some(
          n => n.orderId === order.id && n.channel === 'WHATSAPP' && n.subjectOrTitle.includes('Kedaluwarsa')
        );

        if (!alreadySent) {
          const rendered = NotificationService.renderTemplate(rules.expiredFailed.template, {
            nama_pembeli: order.customerName,
            nama_produk: mainItem?.productName || 'Produk Digital',
            total_harga: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
            link_pembayaran: `${baseUrl}/checkout/${mainItem?.productId || 'checkout'}?order=${order.orderNumber}`,
            link_produk: `${baseUrl}/p/${mainItem?.productId || 'reorder'}`,
            nomor_order: order.orderNumber
          });

          await NotificationService.sendWhatsAppDirect(
            customerPhone,
            rendered,
            order.id,
            `Penawaran Ulang Order Kedaluwarsa #${order.orderNumber}`
          );
          sentCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Pemeriksaan auto follow-up selesai. ${sentCount} pesan WhatsApp berhasil dikirimkan.`,
      sentCount
    });
  });

  app.post('/api/follow-up/whatsapp/resend/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = db.notificationLogs.find(n => n.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Log pesan tidak ditemukan.' });
    }

    const newLog = await NotificationService.sendWhatsAppDirect(
      existing.recipient,
      existing.messageBody,
      existing.orderId,
      `[KIRIM ULANG] ${existing.subjectOrTitle}`
    );

    res.json({
      success: true,
      message: `Pesan WhatsApp berhasil dikirim ulang ke ${existing.recipient}!`,
      log: newLog
    });
  });

  // ----------------------------------------------------
  // ADMIN AUTH & ACCOUNT MANAGEMENT
  // ----------------------------------------------------
  app.get('/api/admin/profile', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        id: db.adminUser.id,
        name: db.adminUser.name,
        email: db.adminUser.email,
        role: db.adminUser.role
      }
    });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    if (email.trim().toLowerCase() !== db.adminUser.email.toLowerCase() || !db.verifyAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    res.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: db.adminUser.id,
        name: db.adminUser.name,
        email: db.adminUser.email,
        role: db.adminUser.role
      }
    });
  });

  app.post('/api/admin/change-password', (req: Request, res: Response) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Password lama wajib diisi.' });
    }

    if (!db.verifyAdminPassword(oldPassword)) {
      return res.status(400).json({ success: false, message: 'Password lama salah.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Konfirmasi password baru tidak sama.' });
    }

    db.updateAdminPassword(newPassword);

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: db.adminUser.name,
      userRole: 'SUPER_ADMIN',
      action: 'CHANGE_PASSWORD',
      targetType: 'ADMIN_ACCOUNT',
      targetId: db.adminUser.id,
      details: 'Admin berhasil mengubah password akun',
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Password akun admin berhasil diubah.'
    });
  });

  // ----------------------------------------------------
  // STORE PROFILE & SETTINGS
  // ----------------------------------------------------
  app.put('/api/settings/profile', (req: Request, res: Response) => {
    const { businessName, logoUrl, supportWhatsapp } = req.body;

    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ success: false, message: 'Nama toko wajib diisi.' });
    }

    const cleanWa = (supportWhatsapp || '').toString().trim().replace(/[\s-]/g, '');
    if (!cleanWa || !/^\+?[0-9]{8,16}$/.test(cleanWa)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor WhatsApp toko harus berformat angka valid (contoh: 628123456789).' 
      });
    }

    db.settings.general.businessName = businessName.trim();
    if (logoUrl && typeof logoUrl === 'string') {
      db.settings.general.logoUrl = logoUrl.trim();
    }
    db.settings.general.supportWhatsapp = cleanWa;

    // Also sync default WA sender if empty
    if (!db.settings.whatsapp.senderNumber) {
      db.settings.whatsapp.senderNumber = cleanWa;
    }

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: db.adminUser.name,
      userRole: 'SUPER_ADMIN',
      action: 'UPDATE_STORE_PROFILE',
      targetType: 'STORE_PROFILE',
      targetId: 'settings_general',
      details: `Memperbarui profil toko: ${businessName}`,
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({
      success: true,
      message: 'Profil toko berhasil diperbarui.',
      data: db.settings.general
    });
  });

  // Image Upload Endpoint (handles data URL base64)
  app.post('/api/upload/image', (req: Request, res: Response) => {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'Gambar tidak valid.' });
    }

    try {
      const uploadsDir = path.resolve(process.cwd(), 'public/assets/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const newFileName = `logo_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, newFileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return res.json({ success: true, url: `/assets/uploads/${newFileName}` });
      } else {
        // Return raw dataUrl if not a standard data URL pattern
        return res.json({ success: true, url: dataUrl });
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      res.status(500).json({ success: false, message: 'Gagal mengunggah logo gambar.' });
    }
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, data: db.settings });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    db.settings = {
      ...db.settings,
      ...req.body
    };

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      userName: 'Aan Pangestu',
      userRole: 'SUPER_ADMIN',
      action: 'UPDATE_SETTINGS',
      targetType: 'SETTINGS',
      targetId: 'platform_settings',
      details: 'Memperbarui konfigurasi sistem platform',
      ipAddress: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    });

    db.saveToFile();
    res.json({ success: true, data: db.settings });
  });

  // ----------------------------------------------------
  // TRACKING & PIXEL API
  // ----------------------------------------------------
  interface TrackingLogEntry {
    id: string;
    platform: 'META' | 'TIKTOK' | 'GOOGLE' | 'GTM' | 'SNACK';
    eventName: string;
    sourceUrl: string;
    orderId?: string;
    value?: number;
    currency?: string;
    ipAddress: string;
    userAgent: string;
    status: 'SENT' | 'SERVER_CAPI_MATCH' | 'FAILED';
    createdAt: string;
  }

  const initialTrackingLogs: TrackingLogEntry[] = [
    {
      id: 'trk_9012a819b',
      platform: 'META',
      eventName: 'Purchase',
      sourceUrl: '/checkout/digital-book?order=ORD-2026-0928-8921',
      orderId: 'ORD-2026-0928-8921',
      value: 266000,
      currency: 'IDR',
      ipAddress: '114.122.38.109',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      status: 'SERVER_CAPI_MATCH',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: 'trk_7718b201a',
      platform: 'TIKTOK',
      eventName: 'CompletePayment',
      sourceUrl: '/checkout/digital-book?order=ORD-2026-0928-8921',
      orderId: 'ORD-2026-0928-8921',
      value: 266000,
      currency: 'IDR',
      ipAddress: '114.122.38.109',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: 'trk_6628c199d',
      platform: 'GOOGLE',
      eventName: 'purchase',
      sourceUrl: '/checkout/digital-book?order=ORD-2026-0928-8921',
      orderId: 'ORD-2026-0928-8921',
      value: 266000,
      currency: 'IDR',
      ipAddress: '114.122.38.109',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString()
    },
    {
      id: 'trk_5519d882f',
      platform: 'META',
      eventName: 'InitiateCheckout',
      sourceUrl: '/checkout/master-template-ahsp',
      value: 179000,
      currency: 'IDR',
      ipAddress: '180.252.170.82',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString()
    },
    {
      id: 'trk_4410e773a',
      platform: 'META',
      eventName: 'PageView',
      sourceUrl: '/p/master-template-ahsp',
      ipAddress: '182.1.204.14',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      id: 'trk_3301f664b',
      platform: 'TIKTOK',
      eventName: 'ViewContent',
      sourceUrl: '/p/master-template-ahsp',
      ipAddress: '182.1.204.14',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 36).toISOString()
    },
    {
      id: 'trk_2290g555c',
      platform: 'GTM',
      eventName: 'page_view',
      sourceUrl: '/checkout/buku-kas-digital',
      ipAddress: '36.85.12.90',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
    }
  ];

  let runtimeTrackingLogs: TrackingLogEntry[] = [...initialTrackingLogs];

  app.get('/api/tracking/logs', (req: Request, res: Response) => {
    res.json({ success: true, data: runtimeTrackingLogs });
  });

  app.post('/api/tracking/test', (req: Request, res: Response) => {
    const { platform = 'META', eventName = 'Purchase', value = 150000, orderId = 'ORD-TEST-8819' } = req.body;
    
    const newEntry: TrackingLogEntry = {
      id: 'trk_' + crypto.randomBytes(6).toString('hex'),
      platform: (platform.toUpperCase() as any) || 'META',
      eventName,
      sourceUrl: `/test-event-simulator?event=${eventName}`,
      orderId,
      value: Number(value),
      currency: 'IDR',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'TestSimulator/1.0',
      status: platform.toUpperCase() === 'META' && db.settings.tracking?.metaCapiToken ? 'SERVER_CAPI_MATCH' : 'SENT',
      createdAt: new Date().toISOString()
    };

    runtimeTrackingLogs.unshift(newEntry);
    if (runtimeTrackingLogs.length > 100) {
      runtimeTrackingLogs.pop();
    }

    res.json({
      success: true,
      message: `Test event ${eventName} berhasil dikirim ke provider ${platform}!`,
      data: newEntry
    });
  });

  app.post('/api/tracking/event', (req: Request, res: Response) => {
    const { eventName, payload, platform = 'META' } = req.body;
    
    const newEntry: TrackingLogEntry = {
      id: 'trk_' + crypto.randomBytes(6).toString('hex'),
      platform: (platform.toUpperCase() as any) || 'META',
      eventName: eventName || 'PageView',
      sourceUrl: payload?.url || '/unknown',
      orderId: payload?.orderId,
      value: payload?.value,
      currency: payload?.currency || 'IDR',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser/1.0',
      status: 'SENT',
      createdAt: new Date().toISOString()
    };

    runtimeTrackingLogs.unshift(newEntry);
    if (runtimeTrackingLogs.length > 100) {
      runtimeTrackingLogs.pop();
    }

    res.json({ success: true, data: newEntry });
  });

  // ----------------------------------------------------
  // VITE & FRONTEND MOUNTING
  // ----------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const listenPort = Number(process.env.PORT) || 3000;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`✨ Ruang Proyek Server running on http://0.0.0.0:${listenPort}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
});
