import { getTodayDateString } from '../sowings/sowingUtils';

export const RESERVATION_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
};

export const RESERVATION_STATUS_OPTIONS = [
    { value: RESERVATION_STATUS.PENDING, label: 'Pendiente' },
    { value: RESERVATION_STATUS.CONFIRMED, label: 'Confirmada' },
    { value: RESERVATION_STATUS.DELIVERED, label: 'Entregada' },
    { value: RESERVATION_STATUS.CANCELLED, label: 'Cancelada' },
];

const RESERVATION_STATUS_LABELS = Object.fromEntries(
    RESERVATION_STATUS_OPTIONS.map((option) => [option.value, option.label])
);

export function getReservationStatusLabel(status) {
    return RESERVATION_STATUS_LABELS[status] || status || '—';
}

export const EDITABLE_STATUS_OPTIONS = RESERVATION_STATUS_OPTIONS.filter(
    (option) => option.value !== RESERVATION_STATUS.CANCELLED
);

export function isLiveReservation(reservation) {
    return (
        reservation.active !== false &&
        reservation.status !== RESERVATION_STATUS.CANCELLED
    );
}

export const RESERVATION_FIELD_LABELS = {
    clientId: 'Cliente',
    sowingId: 'Siembra',
    totalPrice: 'Precio total',
    reservationDate: 'Fecha de reserva',
};

export function validateReservationForm(values) {
    const errors = {};

    Object.keys(RESERVATION_FIELD_LABELS).forEach((field) => {
        if (String(values[field] ?? '').trim() === '') {
            errors[field] = 'Este campo es obligatorio.';
        }
    });

    if (!errors.totalPrice) {
        const totalPrice = Number(values.totalPrice);
        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            errors.totalPrice = 'El precio total debe ser un número mayor o igual a 0.';
        }
    }

    return errors;
}

export function getReservationFormInitialValues() {
    return {
        clientId: '',
        sowingId: '',
        totalPrice: '',
        reservationDate: getTodayDateString(),
        notes: '',
        status: RESERVATION_STATUS.PENDING,
    };
}
