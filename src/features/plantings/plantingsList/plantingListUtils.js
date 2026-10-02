import { daysUntil } from '../../../utils/daysUntil';
import { PLANTING_STATUS } from '../plantingStatus';

export const PLANTING_FILTERS_INITIAL_STATE = { bedId: '' };

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function getGerminationPercent(planting) {
    const sown = Number(planting.quantitySown) || 0;
    if (sown <= 0) return 0;
    const germinated = Number(planting.germinatedQuantity) || 0;
    return Math.min(100, Math.round((germinated / sown) * 100));
}

export function searchPlantings(plantings, searchText) {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return plantings;

    return plantings.filter((planting) => {
        const haystack = [planting.seedName, planting.lotNumber, planting.bedCode, planting.notes]
            .filter((v) => v !== undefined && v !== null && v !== '')
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
}

export function filterPlantings(plantings, filters) {
    return plantings.filter((planting) => {
        if (filters.bedId && String(planting.bedId) !== String(filters.bedId)) return false;
        return true;
    });
}

export function filterByStatus(plantings, status) {
    return plantings.filter((planting) => planting.status === status);
}

export function getBedUsage(bed, plantings) {
    const used = plantings
        .filter(
            (p) =>
                String(p.bedId) === String(bed.bedId) &&
                p.active &&
                p.status !== PLANTING_STATUS.FINISHED
        )
        .reduce((total, p) => total + (Number(p.quantitySown) || 0), 0);

    const percent = bed.maxCapacity > 0 ? Math.min(100, (used / bed.maxCapacity) * 100) : 0;
    return { used, percent };
}

export function getGerminationTiming(planting) {
    if (!planting.active) return null;
    if (
        planting.status !== PLANTING_STATUS.SOWN &&
        planting.status !== PLANTING_STATUS.GERMINATING
    ) {
        return null;
    }

    const days = daysUntil(planting.expectedGerminationDate);
    if (days === null) return null;
    if (days < 0) return { label: `Retrasada ${pluralizeDays(-days)}`, level: 'late' };
    if (days === 0) return { label: 'Germina hoy', level: 'warn' };
    return { label: `En ${pluralizeDays(days)}`, level: days <= 2 ? 'warn' : '' };
}