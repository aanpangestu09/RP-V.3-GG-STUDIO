import crypto from 'crypto';
import { db } from '../db/store';
import { Order, OrderItem, TestCaseResult, E2ETestSuiteResult } from '../../src/types/schema';
import { OrderStateMachine } from './orderStateMachine';
import { calculateDashboardMetrics, normalizeOrderStatus } from '../../src/lib/dashboardMetrics';

export type { TestCaseResult, E2ETestSuiteResult };

export class E2ETestRunner {
  public static async runSuite(): Promise<E2ETestSuiteResult> {
    const results: TestCaseResult[] = [];
    const testSessionId = 'test_session_' + Date.now();

    // 0. Record baseline metrics for test mode
    const baselineMetrics = calculateDashboardMetrics(db.orders, '7_days', 'test');
    const baseAllCount = baselineMetrics.allOrdersCount;
    const baseWaitingCount = baselineMetrics.waitingCount;
    const baseWaitingRev = baselineMetrics.waitingRevenue;
    const baseLunasCount = baselineMetrics.lunasCount;
    const baseLunasRev = baselineMetrics.lunasRevenue;
    const baseAbandoned = baselineMetrics.abandonedCount;
    const baseAuditLogsCount = db.auditLogs.length;

    // Helper to create an isolated test order
    const createTestOrder = (orderNumSuffix: string, price: number = 100000, sourceMode: 'test' | 'live' = 'test'): Order => {
      const orderId = `ord_e2e_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const orderNumber = `E2E-${Date.now().toString().slice(-6)}-${orderNumSuffix}`;
      const item: OrderItem = {
        id: 'item_' + crypto.randomBytes(4).toString('hex'),
        orderId,
        productId: 'prod_buku_kas',
        productName: 'Template Kas E2E Test',
        price,
        itemType: 'MAIN'
      };

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        sourceMode,
        customerId: 'cust_e2e_tester',
        customerName: 'Budi E2E Tester',
        customerEmail: `tester_${Date.now()}@example.com`,
        customerPhone: '081299990001',
        items: [item],
        subtotalAmount: price,
        discountAmount: 0,
        totalAmount: price,
        paymentMethod: 'QRIS',
        paymentStatus: 'MENUNGGU', // starts as MENUNGGU
        deliveryStatus: 'PENDING',
        orderBumpAdded: false,
        upsellAdded: false,
        timeline: [{
          id: 'tl_' + crypto.randomBytes(4).toString('hex'),
          orderId,
          title: 'Order Dibuat (E2E Test)',
          description: 'Order pengujian otomatis dibuat',
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.orders.unshift(newOrder);

      // Audit log entry for creation
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        userName: 'Simulator System',
        userRole: 'SUPER_ADMIN',
        action: 'CREATE_ORDER',
        targetType: 'ORDER',
        targetId: orderId,
        details: `Perubahan status order ${orderNumber}: status awal=MENUNGGU, sumber=simulator`,
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString()
      });

      return newOrder;
    };

    // -------------------------------------------------------------------------
    // T1. Buat 1 order -> status MENUNGGU; Semua Order +1; Menunggu +1; nominal Menunggu naik sesuai harga.
    // -------------------------------------------------------------------------
    const orderT1 = createTestOrder('T1', 150000, 'test');
    const metricsAfterT1 = calculateDashboardMetrics(db.orders, '7_days', 'test');

    const t1StatusValid = orderT1.paymentStatus === 'MENUNGGU';
    const t1AllCountValid = metricsAfterT1.allOrdersCount === baseAllCount + 1;
    const t1WaitingCountValid = metricsAfterT1.waitingCount === baseWaitingCount + 1;
    const t1WaitingRevValid = metricsAfterT1.waitingRevenue === baseWaitingRev + 150000;

    const t1Passed = t1StatusValid && t1AllCountValid && t1WaitingCountValid && t1WaitingRevValid;
    results.push({
      id: 'T1',
      name: 'Buat Order Baru',
      expected: 'Status MENUNGGU, Semua Order +1, Menunggu +1, Nominal Menunggu +Rp 150.000',
      actual: `Status: ${orderT1.paymentStatus}, Semua Order: ${metricsAfterT1.allOrdersCount} (+${metricsAfterT1.allOrdersCount - baseAllCount}), Menunggu: ${metricsAfterT1.waitingCount} (+${metricsAfterT1.waitingCount - baseWaitingCount}), Nom: +Rp ${(metricsAfterT1.waitingRevenue - baseWaitingRev).toLocaleString('id-ID')}`,
      passed: t1Passed,
      details: t1Passed ? 'Valid: Order berstatus MENUNGGU dan metrik dasbor sinkron.' : 'Gagal: Metrik atau status tidak sesuai.'
    });

    // -------------------------------------------------------------------------
    // T2. Bayar berhasil -> MENUNGGU jadi LUNAS; Pendapatan naik sesuai harga; Order Lunas +1; Menunggu -1; produk tertandai terkirim; log WA konfirmasi tercatat; batang & titik grafik di hari itu ikut berubah.
    // -------------------------------------------------------------------------
    const waLogsBeforeT2 = db.notificationLogs.filter(n => n.channel === 'WHATSAPP' && n.orderId === orderT1.id).length;
    const transT2 = await OrderStateMachine.transition(orderT1, 'LUNAS', 'simulator', {
      actorName: 'Simulator System',
      details: 'Simulasi bayar berhasil skenario T2'
    });
    const metricsAfterT2 = calculateDashboardMetrics(db.orders, '7_days', 'test');
    const waLogsAfterT2 = db.notificationLogs.filter(n => n.channel === 'WHATSAPP' && n.orderId === orderT1.id).length;

    // Check today's graph point
    const todayStr = new Date().toISOString().split('T')[0];
    const todayChartPoint = metricsAfterT2.dailyTrend.find(p => p.date === todayStr);

    const t2StatusValid = orderT1.paymentStatus === 'LUNAS';
    const t2RevenueValid = metricsAfterT2.pendapatanLunas === baseLunasRev + 150000;
    const t2LunasCountValid = metricsAfterT2.orderLunasCount === baseLunasCount + 1;
    const t2WaitingCountValid = metricsAfterT2.waitingCount === baseWaitingCount; // was +1 then -1
    const t2DeliveredValid = orderT1.deliveryStatus === 'DELIVERED';
    const t2WaLogged = waLogsAfterT2 > waLogsBeforeT2;
    const t2ChartValid = todayChartPoint && todayChartPoint.rev >= 150000 && todayChartPoint.orders >= 1;

    const t2Passed = t2StatusValid && t2RevenueValid && t2LunasCountValid && t2WaitingCountValid && t2DeliveredValid && t2WaLogged && Boolean(t2ChartValid);
    results.push({
      id: 'T2',
      name: 'Bayar Berhasil (Menunggu -> Lunas)',
      expected: 'Status LUNAS, Pendapatan +Rp 150.000, Order Lunas +1, Menunggu -1, Produk terkirim, WA tercatat, Titik grafik revenue & batang terupdate',
      actual: `Status: ${orderT1.paymentStatus}, Pendapatan: Rp ${metricsAfterT2.pendapatanLunas.toLocaleString('id-ID')} (+Rp ${(metricsAfterT2.pendapatanLunas - baseLunasRev).toLocaleString('id-ID')}), Lunas: ${metricsAfterT2.orderLunasCount}, Menunggu: ${metricsAfterT2.waitingCount}, Terkirim: ${orderT1.deliveryStatus}, WA Log: ${waLogsAfterT2 > 0 ? 'Tercatat' : 'Tidak'}, Grafik hari ini: rev=${todayChartPoint?.rev}, orders=${todayChartPoint?.orders}`,
      passed: t2Passed,
      details: t2Passed ? 'Valid: Pembayaran lunas, file terkirim, WA tercatat, grafik sinkron.' : 'Gagal pada verifikasi status atau notifikasi.'
    });

    // -------------------------------------------------------------------------
    // T3. Bayar gagal (order baru) -> status GAGAL; Pendapatan tidak berubah; Abandoned +1.
    // -------------------------------------------------------------------------
    const orderT3 = createTestOrder('T3', 85000, 'test');
    const revenueBeforeT3 = metricsAfterT2.pendapatanLunas;
    const abandonedBeforeT3 = metricsAfterT2.abandonedCount;

    await OrderStateMachine.transition(orderT3, 'GAGAL', 'simulator', {
      actorName: 'Simulator System',
      details: 'Simulasi bayar ditolak/gagal T3'
    });
    const metricsAfterT3 = calculateDashboardMetrics(db.orders, '7_days', 'test');

    const t3StatusValid = orderT3.paymentStatus === 'GAGAL';
    const t3RevenueUnchanged = metricsAfterT3.pendapatanLunas === revenueBeforeT3;
    const t3AbandonedValid = metricsAfterT3.abandonedCount === abandonedBeforeT3 + 1;

    const t3Passed = t3StatusValid && t3RevenueUnchanged && t3AbandonedValid;
    results.push({
      id: 'T3',
      name: 'Bayar Gagal (Menunggu -> Gagal)',
      expected: 'Status GAGAL, Pendapatan tidak berubah, Abandoned +1',
      actual: `Status: ${orderT3.paymentStatus}, Pendapatan tetap: Rp ${metricsAfterT3.pendapatanLunas.toLocaleString('id-ID')}, Abandoned: ${metricsAfterT3.abandonedCount} (+${metricsAfterT3.abandonedCount - abandonedBeforeT3})`,
      passed: t3Passed,
      details: t3Passed ? 'Valid: Order gagal tidak menambah pendapatan dan masuk abandoned.' : 'Gagal pada status atau abandoned counter.'
    });

    // -------------------------------------------------------------------------
    // T4. Kedaluwarsa (order baru, majukan waktu melewati batas) -> status KADALUARSA; Abandoned +1.
    // -------------------------------------------------------------------------
    const orderT4 = createTestOrder('T4', 99000, 'test');
    // Set creation date back by 25 hours to simulate elapsed deadline
    orderT4.createdAt = new Date(Date.now() - 25 * 3600000).toISOString();
    const abandonedBeforeT4 = metricsAfterT3.abandonedCount;

    await OrderStateMachine.transition(orderT4, 'KADALUARSA', 'simulator', {
      actorName: 'Simulator System',
      details: 'Simulasi kadaluarsa melewati 24 jam T4'
    });
    const metricsAfterT4 = calculateDashboardMetrics(db.orders, '7_days', 'test');

    const t4StatusValid = orderT4.paymentStatus === 'KADALUARSA';
    const t4AbandonedValid = metricsAfterT4.abandonedCount === abandonedBeforeT4 + 1;

    const t4Passed = t4StatusValid && t4AbandonedValid;
    results.push({
      id: 'T4',
      name: 'Order Kedaluwarsa',
      expected: 'Status KADALUARSA, Abandoned +1',
      actual: `Status: ${orderT4.paymentStatus}, Abandoned: ${metricsAfterT4.abandonedCount} (+${metricsAfterT4.abandonedCount - abandonedBeforeT4})`,
      passed: t4Passed,
      details: t4Passed ? 'Valid: Order kedaluwarsa masuk ke daftar abandoned.' : 'Gagal pada status atau counter.'
    });

    // -------------------------------------------------------------------------
    // T5. Event pembayaran dikirim 2x untuk order yang sama -> Pendapatan bertambah SEKALI saja; log "duplikat diabaikan" muncul.
    // -------------------------------------------------------------------------
    const revenueBeforeT5 = metricsAfterT4.pendapatanLunas;
    // Send second payment event for orderT1 (already LUNAS)
    const duplicateRes = await OrderStateMachine.transition(orderT1, 'LUNAS', 'simulator', {
      actorName: 'Simulator System (Duplicate Replay)',
      details: 'Pengujian event pembayaran kedua untuk order yang sama'
    });
    const metricsAfterT5 = calculateDashboardMetrics(db.orders, '7_days', 'test');

    const duplicateAuditLog = db.auditLogs.find(a => 
      a.targetId === orderT1.id && 
      (a.action === 'DUPLICATE_PAYMENT_IGNORED' || a.details.toLowerCase().includes('duplikat diabaikan'))
    );

    const t5RevenueNotDouble = metricsAfterT5.pendapatanLunas === revenueBeforeT5;
    const t5DuplicateLogged = Boolean(duplicateAuditLog) && duplicateRes.isDuplicate === true;

    const t5Passed = t5RevenueNotDouble && t5DuplicateLogged;
    results.push({
      id: 'T5',
      name: 'Idempoten: Pembayaran Duplikat 2x',
      expected: 'Pendapatan bertambah SEKALI saja, log "duplikat diabaikan" tercatat di Audit Log',
      actual: `Pendapatan tetap: Rp ${metricsAfterT5.pendapatanLunas.toLocaleString('id-ID')} (tidak dobel), Log audit: "${duplicateAuditLog?.action || 'NONE'}" (detail memuat: "${duplicateAuditLog?.details.slice(0, 45)}...")`,
      passed: t5Passed,
      details: t5Passed ? 'Valid: Idempotency terjaga dan duplikasi tercatat di audit log.' : 'Gagal: Terjadi penambahan dobel atau log audit duplikat tidak tercatat.'
    });

    // -------------------------------------------------------------------------
    // T6. Coba ubah order LUNAS kembali ke MENUNGGU -> DITOLAK; status tetap LUNAS; tercatat di Audit Log.
    // -------------------------------------------------------------------------
    const attemptRevert = await OrderStateMachine.transition(orderT1, 'MENUNGGU', 'manual', {
      actorName: 'Admin Tester',
      details: 'Percobaan terlarang: mengembalikan order LUNAS ke MENUNGGU'
    });

    const rejectionAuditLog = db.auditLogs.find(a => 
      a.targetId === orderT1.id && 
      a.action === 'INVALID_STATUS_TRANSITION_REJECTED'
    );

    const t6Rejected = attemptRevert.success === false && attemptRevert.rejected === true;
    const t6StatusStayedLunas = orderT1.paymentStatus === 'LUNAS';
    const t6AuditLogged = Boolean(rejectionAuditLog);

    const t6Passed = t6Rejected && t6StatusStayedLunas && t6AuditLogged;
    results.push({
      id: 'T6',
      name: 'Kunci Status Akhir: Larang Kembali ke MENUNGGU',
      expected: 'DITOLAK, status tetap LUNAS, penolakan tercatat di Audit Log',
      actual: `Hasil transisi: ${attemptRevert.rejected ? 'DITOLAK' : 'DITERIMA'}, Status order: ${orderT1.paymentStatus}, Audit Log penolakan: ${t6AuditLogged ? 'Tercatat' : 'Tidak'}`,
      passed: t6Passed,
      details: t6Passed ? 'Valid: Status akhir tidak bisa diubah kembali ke status awal dan penolakan terekam di audit log.' : 'Gagal: Transisi terlarang tidak ditolak.'
    });

    // -------------------------------------------------------------------------
    // T7. Invarian: Menunggu + Lunas + Gagal + Kadaluarsa = Semua Order (jumlah dan nominal).
    // -------------------------------------------------------------------------
    const currentMetrics = calculateDashboardMetrics(db.orders, '7_days', 'test');
    const { 
      waitingCount, lunasCount, gagalCount, kadaluarsaCount, allOrdersCount,
      waitingRevenue, lunasRevenue, gagalRevenue, kadaluarsaRevenue, allOrdersRevenue
    } = currentMetrics;

    const countSum = waitingCount + lunasCount + gagalCount + kadaluarsaCount;
    const revSum = waitingRevenue + lunasRevenue + gagalRevenue + kadaluarsaRevenue;

    const t7CountValid = countSum === allOrdersCount;
    const t7RevValid = revSum === allOrdersRevenue;
    const t7Passed = t7CountValid && t7RevValid;

    results.push({
      id: 'T7',
      name: 'Invarian Konsistensi Matematika',
      expected: 'Menunggu + Lunas + Gagal + Kadaluarsa = Semua Order (Jumlah & Nominal Total 100% sama)',
      actual: `Jumlah: ${waitingCount} + ${lunasCount} + ${gagalCount} + ${kadaluarsaCount} = ${countSum} (Semua Order: ${allOrdersCount}, selisih: ${countSum - allOrdersCount}) | Nominal: Rp ${revSum.toLocaleString('id-ID')} (Semua Order: Rp ${allOrdersRevenue.toLocaleString('id-ID')}, selisih: ${revSum - allOrdersRevenue})`,
      passed: t7Passed,
      details: t7Passed ? 'Valid: Invarian matematika selalu terpenuhi tanpa selisih (diff = 0).' : 'Gagal: Terdapat selisih antara rincian status dan semua order.'
    });

    // -------------------------------------------------------------------------
    // T8. Angka kartu = ringkasan = grafik (pada periode yang sama)
    // -------------------------------------------------------------------------
    const chartTotalOrders = currentMetrics.dailyTrend.reduce((sum, p) => sum + p.orders, 0);
    const chartTotalRevenue = currentMetrics.dailyTrend.reduce((sum, p) => sum + p.rev, 0);

    const t8OrdersMatch = currentMetrics.allOrdersCount === chartTotalOrders;
    const t8RevenueMatch = currentMetrics.pendapatanLunas === chartTotalRevenue;
    const t8KpiMatch = currentMetrics.pendapatanLunas === currentMetrics.lunasRevenue && currentMetrics.orderLunasCount === currentMetrics.lunasCount;

    // Verify derived formulas as part of T8 consistency
    const expectedKonversi = allOrdersCount > 0 ? Number(((lunasCount / allOrdersCount) * 100).toFixed(1)) : 0;
    const expectedAov = lunasCount > 0 ? Math.round(lunasRevenue / lunasCount) : 0;
    const formulasMatch = currentMetrics.konversiPercent === expectedKonversi && currentMetrics.aov === expectedAov;

    const t8Passed = t8OrdersMatch && t8RevenueMatch && t8KpiMatch && formulasMatch;
    results.push({
      id: 'T8',
      name: 'Angka Kartu = Ringkasan = Grafik',
      expected: 'Kartu KPI = Ringkasan Status = Total Data Grafik pada periode yang sama (Orders & Revenue sinkron 100%)',
      actual: `KPI Pendapatan: Rp ${currentMetrics.pendapatanLunas.toLocaleString('id-ID')} | Ringkasan Lunas: Rp ${currentMetrics.lunasRevenue.toLocaleString('id-ID')} | Total Grafik Rev: Rp ${chartTotalRevenue.toLocaleString('id-ID')} | Total Grafik Orders: ${chartTotalOrders} (Semua Order: ${currentMetrics.allOrdersCount}) | Konversi: ${currentMetrics.konversiPercent}%`,
      passed: t8Passed,
      details: t8Passed ? 'Valid: Seluruh komponen membaca dan menampilkan angka yang sinkron dari sumber data yang sama.' : 'Gagal: Angka di grafik dan kartu KPI berbeda.'
    });

    // -------------------------------------------------------------------------
    // T9. Data Test tidak masuk hitungan Mode Live
    // -------------------------------------------------------------------------
    const liveOrder = createTestOrder('LIVE', 500000, 'live');
    const liveMetrics = calculateDashboardMetrics(db.orders, '7_days', 'live');
    const testMetrics = calculateDashboardMetrics(db.orders, '7_days', 'test');

    // Test data should not count the live order
    const testDoesNotIncludeLive = !testMetrics.filteredOrders.some(o => o.id === liveOrder.id);
    // Live data should ONLY include live orders
    const liveOnlyIncludesLive = liveMetrics.filteredOrders.every(o => o.sourceMode === 'live');
    const liveIncludesThisOrder = liveMetrics.filteredOrders.some(o => o.id === liveOrder.id);
    const liveExcludesTestOrders = !liveMetrics.filteredOrders.some(o => o.id === orderT1.id || o.id === orderT3.id || o.id === orderT4.id);

    const t9Passed = testDoesNotIncludeLive && liveOnlyIncludesLive && liveIncludesThisOrder && liveExcludesTestOrders;
    results.push({
      id: 'T9',
      name: 'Data Test Tidak Masuk Hitungan Mode Live',
      expected: 'Data Test terisolasi penuh dari Mode Live, dan sebaliknya (Dashboard memfilter sesuai toggle mode)',
      actual: `Order Live (Rp 500.000) masuk ke Mode Live (${liveMetrics.allOrdersCount} order), TIDAK masuk ke Mode Test (${testMetrics.allOrdersCount} order). Order Test (T1, T3, T4) tidak bocor ke Mode Live.`,
      passed: t9Passed,
      details: t9Passed ? 'Valid: Data test dan data live terpisah sempurna berdasarkan toggle mode.' : 'Gagal: Data test bocor ke mode live atau sebaliknya.'
    });

    db.saveToFile();

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      success: failedCount === 0,
      totalScenarios: results.length,
      passedCount,
      failedCount,
      results,
      executedAt: new Date().toISOString()
    };
  }
}
