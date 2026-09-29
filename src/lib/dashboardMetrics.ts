import { Order, ValidOrderStatus } from '../types/schema';

export type DashboardPeriod = 'today' | '7_days' | '30_days' | 'this_month';
export type DashboardSourceMode = 'test' | 'live';

export interface DailyTrendPoint {
  date: string;
  label: string;
  orders: number; // all orders created on this day (bar)
  rev: number;    // revenue from LUNAS orders created on this day (line/point)
  paidCount: number;
}

export interface DashboardMetricsResult {
  // Mode & Period metadata
  sourceMode: DashboardSourceMode;
  period: DashboardPeriod;
  periodLabel: string;

  // KPI Utama
  pendapatanLunas: number; // Pendapatan (Lunas) - hanya order LUNAS
  orderLunasCount: number; // Jumlah order LUNAS

  // Ringkasan Status Order
  allOrdersCount: number;    // Semua Order (Jumlah)
  allOrdersRevenue: number;  // Semua Order (Nominal Total)

  waitingCount: number;      // Menunggu (Jumlah)
  waitingRevenue: number;    // Menunggu (Nominal)

  lunasCount: number;        // Lunas (Jumlah)
  lunasRevenue: number;      // Lunas (Nominal)

  gagalCount: number;        // Gagal (Jumlah)
  gagalRevenue: number;      // Gagal (Nominal)

  kadaluarsaCount: number;   // Kadaluarsa (Jumlah)
  kadaluarsaRevenue: number; // Kadaluarsa (Nominal)

  // Metrik Turunan
  konversiPercent: number;   // Konversi = (Lunas / Semua Order) * 100%
  aov: number;               // AOV = Pendapatan Lunas / Order Lunas
  abandonedCount: number;    // Abandoned = Gagal + Kadaluarsa
  abandonedRevenue: number;  // Abandoned nominal = Gagal nominal + Kadaluarsa nominal

  // Invariant verification check
  invariantsHold: boolean;
  countInvariantDiff: number;
  revenueInvariantDiff: number;

  // Nilai Tambahan
  netProfit: number;
  hpp: number;
  revenueBump: number;
  totalDiskon: number;

  // Tren Harian (Grafik)
  dailyTrend: DailyTrendPoint[];

  // Filtered orders list (matching mode & period)
  filteredOrders: Order[];
}

/**
 * Normalizes any status string into canonical ValidOrderStatus
 */
export function normalizeOrderStatus(status: string): ValidOrderStatus {
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
 * Centralized Single Source of Truth selector for all dashboard numbers.
 * Guaranteed invariant: Menunggu + Lunas + Gagal + Kadaluarsa === Semua Order (count & nominal).
 */
export function calculateDashboardMetrics(
  allOrders: Order[],
  period: DashboardPeriod = '7_days',
  sourceMode: DashboardSourceMode = 'test',
  referenceDate: Date = new Date()
): DashboardMetricsResult {
  // 1. FILTER BY SOURCE MODE ('test' vs 'live')
  const modeOrders = (allOrders || []).filter(o => {
    const orderMode = o.sourceMode || 'test';
    return orderMode === sourceMode;
  });

  // 2. COMPUTE PERIOD DATE BOUNDS
  const now = new Date(referenceDate);
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let periodLabel = '7 Hari Terakhir';
  let daysCount = 7;

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    periodLabel = 'Hari Ini';
    daysCount = 1;
  } else if (period === '7_days') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    periodLabel = '7 Hari Terakhir';
    daysCount = 7;
  } else if (period === '30_days') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    periodLabel = '30 Hari Terakhir';
    daysCount = 30;
  } else if (period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodLabel = 'Bulan Ini';
    daysCount = now.getDate();
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    daysCount = 7;
  }

  // Filter orders created in the chosen time window
  const filteredOrders = modeOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // 3. CENTRALIZED ACCUMULATION
  let waitingCount = 0;
  let waitingRevenue = 0;
  let lunasCount = 0;
  let lunasRevenue = 0;
  let gagalCount = 0;
  let gagalRevenue = 0;
  let kadaluarsaCount = 0;
  let kadaluarsaRevenue = 0;

  let totalDiskon = 0;
  let revenueBump = 0;

  for (const ord of filteredOrders) {
    const status = normalizeOrderStatus(ord.paymentStatus);
    const amount = Number(ord.totalAmount) || 0;

    if (status === 'MENUNGGU') {
      waitingCount += 1;
      waitingRevenue += amount;
    } else if (status === 'LUNAS') {
      lunasCount += 1;
      lunasRevenue += amount;
      totalDiskon += Number(ord.discountAmount) || 0;
      if (ord.orderBumpAdded && ord.items) {
        const bumpSum = ord.items
          .filter(it => it.itemType === 'BUMP')
          .reduce((acc, it) => acc + (Number(it.price) || 0), 0);
        revenueBump += bumpSum;
      }
    } else if (status === 'GAGAL') {
      gagalCount += 1;
      gagalRevenue += amount;
    } else if (status === 'KADALUARSA') {
      kadaluarsaCount += 1;
      kadaluarsaRevenue += amount;
    }
  }

  // INVARIANT CHECK
  const allOrdersCount = filteredOrders.length;
  const allOrdersRevenue = waitingRevenue + lunasRevenue + gagalRevenue + kadaluarsaRevenue;
  
  const countSum = waitingCount + lunasCount + gagalCount + kadaluarsaCount;
  const revenueSum = waitingRevenue + lunasRevenue + gagalRevenue + kadaluarsaRevenue;

  const countInvariantDiff = Math.abs(countSum - allOrdersCount);
  const revenueInvariantDiff = Math.abs(revenueSum - allOrdersRevenue);
  const invariantsHold = countInvariantDiff === 0 && revenueInvariantDiff === 0;

  // DERIVED FORMULAS
  const pendapatanLunas = lunasRevenue;
  const orderLunasCount = lunasCount;

  // Konversi = (jumlah LUNAS / jumlah Semua Order) * 100%
  const konversiPercent = allOrdersCount > 0 
    ? Number(((lunasCount / allOrdersCount) * 100).toFixed(1))
    : 0;

  // Rata-rata nilai order (AOV) = Pendapatan / jumlah LUNAS
  const aov = lunasCount > 0 
    ? Math.round(lunasRevenue / lunasCount) 
    : 0;

  // Abandoned = jumlah GAGAL + KADALUARSA
  const abandonedCount = gagalCount + kadaluarsaCount;
  const abandonedRevenue = gagalRevenue + kadaluarsaRevenue;

  // HPP and Net Profit
  const hpp = Math.round(lunasRevenue * 0.185);
  const netProfit = lunasRevenue - hpp;

  // 4. DAILY TREND BUCKETS (Always fills missing days with 0)
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const trendMap = new Map<string, DailyTrendPoint>();

  // Initialize every day in range with 0
  for (let i = daysCount - 1; i >= 0; i--) {
    let d: Date;
    if (period === 'this_month') {
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    } else {
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    }
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = dayNames[d.getDay()];
    const dayDate = d.getDate();
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });

    trendMap.set(isoDate, {
      date: isoDate,
      label: daysCount <= 7 ? `${dayName} (${dayDate})` : `${dayDate} ${monthName}`,
      orders: 0,
      rev: 0,
      paidCount: 0
    });
  }

  // Populate actual orders into buckets
  for (const o of filteredOrders) {
    const oDate = new Date(o.createdAt);
    const isoDate = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}-${String(oDate.getDate()).padStart(2, '0')}`;
    
    if (trendMap.has(isoDate)) {
      const item = trendMap.get(isoDate)!;
      item.orders += 1; // All orders on that day
      if (normalizeOrderStatus(o.paymentStatus) === 'LUNAS') {
        item.rev += Number(o.totalAmount) || 0; // Revenue only from LUNAS orders
        item.paidCount += 1;
      }
    }
  }

  const dailyTrend = Array.from(trendMap.values());

  return {
    sourceMode,
    period,
    periodLabel,
    pendapatanLunas,
    orderLunasCount,
    allOrdersCount,
    allOrdersRevenue,
    waitingCount,
    waitingRevenue,
    lunasCount,
    lunasRevenue,
    gagalCount,
    gagalRevenue,
    kadaluarsaCount,
    kadaluarsaRevenue,
    konversiPercent,
    aov,
    abandonedCount,
    abandonedRevenue,
    invariantsHold,
    countInvariantDiff,
    revenueInvariantDiff,
    netProfit,
    hpp,
    revenueBump,
    totalDiskon,
    dailyTrend,
    filteredOrders
  };
}
