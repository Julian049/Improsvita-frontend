import { toLocalDate } from './dateUtils';

export const EXPIRATION_THRESHOLDS = { critical: 7, warning: 30 };

const MS_PER_DAY = 86400000;

function pluralizeDays(n) {
    return `${n} ${n === 1 ? 'día' : 'días'}`;
}

export function getExpirationStatus(
    dueDate,
    today = new Date(),
    thresholds = EXPIRATION_THRESHOLDS
) {
    if (!dueDate) return { level: 'none', daysLeft: null, label: 'Sin fecha de vencimiento' };

    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysLeft = Math.round((toLocalDate(String(dueDate).slice(0, 10)) - start) / MS_PER_DAY);

    if (daysLeft < 0) {
        return { level: 'expired', daysLeft, label: `Vencido hace ${pluralizeDays(Math.abs(daysLeft))}` };
    }
    if (daysLeft === 0) return { level: 'critical', daysLeft, label: 'Vence hoy' };
    if (daysLeft <= thresholds.critical) {
        return { level: 'critical', daysLeft, label: `Vence en ${pluralizeDays(daysLeft)}` };
    }
    if (daysLeft <= thresholds.warning) {
        return { level: 'warning', daysLeft, label: `Vence en ${pluralizeDays(daysLeft)}` };
    }
    return { level: 'ok', daysLeft, label: 'Vigente' };
}

export const ALERT_LEVELS = ['expired', 'critical', 'warning'];