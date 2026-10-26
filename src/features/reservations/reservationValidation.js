import { getTodayDateString } from '../sowings/sowingUtils';
import { getSeedlingCount } from '../seedlings/seedlingApi';

// SUPUESTO: estados tomados del SRS (RF 5.1–5.4); los valores exactos dependen del backend.
export const RESERVATION_STATUS_OPTIONS = [
    { value: 'RESERVED', label: 'Reservada' },
    { value: 'DELIVERED', label: 'Entregada' },
    { value: 'CANCELLED', label: 'Cancelada' },
];

const RESERVATION_STATUS_LABELS = Object.fromEntries(RESERVATION_STATUS_OPTIONS.map((o) => [o.value, o.label]));

export function getReservationStatusLabel(status) {
    return RESERVATION_STATUS_LABELS[status] || status || '—';
}

export const RESERVATION_FIELD_LABELS = {
    clientId: 'Cliente',
    sowingId: 'Planta',
    quantity: 'Cantidad',
    reservationDate: 'Fecha de reserva',
    deliveryDate: 'Fecha prevista de entrega',
};

// SUPUESTO: disponibles = plántulas de la siembra (germinadas, o estimadas si no hay revisión)
// menos las otras reservas activas (RESERVED) sobre esa siembra.
export function getAvailableSeedlings(sowing, reservations, currentReservationId) {
    const reserved = reservations
        .filter(
            (r) =>
                r.status === 'RESERVED' &&
                String(r.sowingId) === String(sowing.sowingId) &&
                String(r.reservationId) !== String(currentReservationId)
        )
        .reduce((sum, r) => sum + Number(r.quantity), 0);
    return Math.max(0, (getSeedlingCount(sowing) ?? 0) - reserved);
}

// SRS RF 5.1: cantidad ≤ stock disponible y fecha prevista de entrega ≥ fecha de reserva.
export function validateReservationForm(values, { maxQuantity } = {}) {
    const errors = {};

    Object.keys(RESERVATION_FIELD_LABELS).forEach((field) => {
        if (String(values[field] ?? '').trim() === '') errors[field] = 'Este campo es obligatorio.';
    });

    if (!errors.quantity) {
        const quantity = Number(values.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            errors.quantity = 'La cantidad debe ser un número entero mayor a 0.';
        } else if (maxQuantity != null && quantity > maxQuantity) {
            errors.quantity = `No puede superar las plántulas disponibles (${maxQuantity}).`;
        }
    }

    if (!errors.reservationDate && !errors.deliveryDate && values.deliveryDate < values.reservationDate) {
        errors.deliveryDate = 'Debe ser igual o posterior a la fecha de reserva.';
    }

    return errors;
}

export function getReservationFormInitialValues() {
    return {
        clientId: '',
        sowingId: '',
        quantity: '',
        reservationDate: getTodayDateString(),
        deliveryDate: '',
    };
}
