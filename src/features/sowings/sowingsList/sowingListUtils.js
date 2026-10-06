import { daysUntil } from '../../../utils/daysUntil';
import { SOWING_STATUS } from '../sowingStatus';

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function getGerminationPercent(sowing) {
    return Math.min(100, Math.round(sowing.germinationRate ?? 0));
}

export function groupByStatus(sowings, status) {
    return sowings.filter((sowing) => sowing.status === status);
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
