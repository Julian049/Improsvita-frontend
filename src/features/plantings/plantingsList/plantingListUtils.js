import { daysUntil } from '../../../utils/daysUntil';
import { PLANTING_STATUS, isTerminalStatus } from '../plantingStatus';

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function getGerminationPercent(planting) {
    return Math.min(100, Math.round(planting.germinationRate ?? 0));
}

export function groupByStatus(plantings, status) {
    return plantings.filter((planting) => planting.status === status);
}

export function getBedUsage(bed, plantings) {
    const used = plantings
        .filter((p) => String(p.bedId) === String(bed.bedId) && !isTerminalStatus(p.status))
        .reduce((total, p) => total + (Number(p.quantitySown) || 0), 0);

    const percent = bed.maxCapacity > 0 ? Math.min(100, (used / bed.maxCapacity) * 100) : 0;
    return { used, percent };
}

export function getGerminationTiming(planting) {
    if (
        planting.status !== PLANTING_STATUS.PLANNED &&
        planting.status !== PLANTING_STATUS.IN_PROGRESS
    ) {
        return null;
    }

    const days = daysUntil(planting.expectedGerminationDate);
    if (days === null) return null;
    if (days < 0) return { label: `Retrasada ${pluralizeDays(-days)}`, level: 'late' };
    if (days === 0) return { label: 'Germina hoy', level: 'warn' };
    return { label: `En ${pluralizeDays(days)}`, level: days <= 2 ? 'warn' : '' };
}
