import { daysUntil } from '../../../utils/daysUntil';
import { SOWING_STATUS, isTerminalStatus } from '../sowingStatus';

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function getGerminationPercent(sowing) {
    return Math.min(100, Math.round(sowing.germinationRate ?? 0));
}

export function groupByStatus(sowings, status) {
    return sowings.filter((sowing) => sowing.status === status);
}

export function getBedUsage(bed, sowings) {
    const used = sowings
        .filter((sowing) => String(sowing.bedId) === String(bed.bedId) && !isTerminalStatus(sowing.status))
        .reduce((total, sowing) => total + (Number(sowing.quantitySown) || 0), 0);

    const percent = bed.maxCapacity > 0 ? Math.min(100, (used / bed.maxCapacity) * 100) : 0;
    return { used, percent };
}

export function getGerminationTiming(sowing) {
    if (
        sowing.status !== SOWING_STATUS.PLANNED &&
        sowing.status !== SOWING_STATUS.IN_PROGRESS
    ) {
        return null;
    }

    const days = daysUntil(sowing.expectedGerminationDate);
    if (days === null) return null;
    if (days < 0) return { label: `Retrasada ${pluralizeDays(-days)}`, level: 'late' };
    if (days === 0) return { label: 'Germina hoy', level: 'warn' };
    return { label: `En ${pluralizeDays(days)}`, level: days <= 2 ? 'warn' : '' };
}
