import { isTerminalStatus } from '../sowings/sowingStatus';
import { getBedUsage } from '../sowings/sowingUtils';
import { getEstimatedProduction, getGerminationTiming } from '../sowings/sowingsList/sowingListUtils';

// Un lote con menos del 30% de su cantidad inicial se considera con poco stock (mismo umbral que la lista de lotes).
const LOW_STOCK_RATIO = 0.3;

function toDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toSaleDate(sale) {
    return String(sale?.saleDate ?? '').slice(0, 10);
}

function toAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
}

export function getCommercialData({ sales = [], reservations = [], today = new Date() }) {
    const todayKey = toDateKey(today);
    const monthKey = todayKey.slice(0, 7);
    const activeSales = sales.filter((sale) => sale.active !== false);
    const monthSales = activeSales.filter((sale) => toSaleDate(sale).startsWith(monthKey));
    const todaySales = monthSales.filter((sale) => toSaleDate(sale) === todayKey);
    const pendingReservations = reservations.filter(
        (reservation) => reservation.active !== false && reservation.status === 'PENDING'
    ).length;

    const lastSale = monthSales.reduce((latest, sale) => {
        if (!latest) return sale;
        const saleDate = toSaleDate(sale);
        const latestDate = toSaleDate(latest);
        if (saleDate > latestDate) return sale;
        if (saleDate === latestDate && Number(sale.id) > Number(latest.id)) return sale;
        return latest;
    }, null);

    return {
        salesToday: todaySales.length,
        unitsToday: todaySales.reduce((sum, sale) => sum + toAmount(sale.quantity), 0),
        revenueToday: todaySales.reduce((sum, sale) => sum + toAmount(sale.total), 0),
        salesMonth: monthSales.length,
        revenueMonth: monthSales.reduce((sum, sale) => sum + toAmount(sale.total), 0),
        pendingReservations,
        lastSale,
    };
}

export function getDashboardData({ seeds, lots, sowings, beds }) {
    const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
    const lotById = new Map(lots.map((l) => [String(l.lotId), l]));

    const availableLots = lots.filter((l) => Number(l.availableQuantity) > 0);
    const openSowings = sowings
        .filter((s) => !isTerminalStatus(s.status))
        .map((s) => {
            const lot = lotById.get(String(s.lotId));
            return {
                ...s,
                lotNumber: lot?.lotNumber ?? '',
                seedName: lot ? seedNameById.get(String(lot.seedId)) ?? '' : '',
                germinationPercentage: lot?.germinationPercentage ?? null,
                bedCode: beds.find((b) => String(b.bedId) === String(s.bedId))?.code ?? '',
            };
        });
    // La última revisión manda sobre el % esperado del lote.
    const production = openSowings.map(
        (s) => s.germinatedQuantity ?? getEstimatedProduction(s)
    );

    return {
        activeSeeds: seeds.filter((s) => s.active).length,
        availableStock: availableLots.reduce((sum, l) => sum + Number(l.availableQuantity), 0),
        availableLotCount: availableLots.length,
        openSowingCount: openSowings.length,
        estimatedProduction: production.reduce((sum, e) => sum + (e ?? 0), 0),
        sowingsWithReview: openSowings.filter((s) => s.germinatedQuantity != null).length,
        sowingsWithoutProduction: production.filter((e) => e == null).length,
        // Retrasadas primero, luego las que germinan hoy o en 1-2 días.
        attention: openSowings
            .map((s) => ({ ...s, timing: getGerminationTiming(s) }))
            .filter((s) => s.timing && s.timing.level)
            .sort((a, b) => (a.timing.level === 'late' ? -1 : 0) - (b.timing.level === 'late' ? -1 : 0)),
        lowStockLots: availableLots
            .filter((l) => Number(l.initialQuantity) > 0 && l.availableQuantity / l.initialQuantity < LOW_STOCK_RATIO)
            .map((l) => ({ ...l, seedName: seedNameById.get(String(l.seedId)) ?? '' })),
        bedUsage: beds.filter((b) => b.active).map((b) => ({ ...b, ...getBedUsage(b, sowings) })),
    };
}
