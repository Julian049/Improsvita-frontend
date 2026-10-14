import { daysUntil } from '../../../utils/daysUntil';
import { SOWING_STATUS } from '../sowingStatus';

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

// Producción estimada = sembradas × % de germinación del lote. null si el lote no tiene ese %.
export function getEstimatedProduction(sowing) {
    if (sowing.germinationPercentage == null) return null;
    return Math.floor((sowing.quantitySown * sowing.germinationPercentage) / 100);
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
