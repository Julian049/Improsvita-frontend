import { daysUntil } from '../../utils/daysUntil';

const normalize = (text) =>
    String(text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

// Coincidencia parcial, sin mayúsculas ni tildes, en cliente o planta.
export function filterReservations(reservations, query) {
    const needle = normalize(query.trim());
    if (!needle) return reservations;
    return reservations.filter((r) => normalize(`${r.clientName} ${r.plantName}`).includes(needle));
}

// Solo las reservas activas tienen una entrega pendiente que vigilar.
export function getDeliveryTiming(reservation) {
    if (reservation.status !== 'RESERVED') return null;
    const days = daysUntil(reservation.deliveryDate);
    if (days === null) return null;
    if (days < 0) return { label: `Atrasada ${pluralizeDays(-days)}`, level: 'late' };
    if (days === 0) return { label: 'Se entrega hoy', level: 'warn' };
    return { label: `En ${pluralizeDays(days)}`, level: days <= 2 ? 'warn' : '' };
}
