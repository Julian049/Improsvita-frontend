import { isTerminalStatus } from '../sowings/sowingStatus';
import { getBedUsage } from '../sowings/sowingUtils';
import { getEstimatedProduction, getGerminationTiming } from '../sowings/sowingsList/sowingListUtils';

// Un lote con menos del 30% de su cantidad inicial se considera con poco stock (mismo umbral que la lista de lotes).
const LOW_STOCK_RATIO = 0.3;

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
    const estimates = openSowings.map(getEstimatedProduction);

    return {
        activeSeeds: seeds.filter((s) => s.active).length,
        availableStock: availableLots.reduce((sum, l) => sum + Number(l.availableQuantity), 0),
        availableLotCount: availableLots.length,
        openSowingCount: openSowings.length,
        estimatedProduction: estimates.reduce((sum, e) => sum + (e ?? 0), 0),
        sowingsWithoutPercent: estimates.filter((e) => e == null).length,
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
