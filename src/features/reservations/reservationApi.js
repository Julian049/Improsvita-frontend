// SUPUESTO: el backend todavía no tiene reservas. Endpoints y forma de los datos asumidos
// (ver "Reservas" en CLAUDE.md); revisar contra la API real cuando exista.
//   GET  /reservations       -> [{ id, clientId, sowingId, quantity, reservationDate, deliveryDate, status }]
//   GET  /reservations/{id}
//   POST /reservations       <- { clientId, sowingId, quantity, reservationDate, deliveryDate }  (estado inicial RESERVED en el backend)
//   PUT  /reservations/{id}  <- mismo cuerpo
//   PUT  /reservations/{id}/status <- { status: 'CANCELLED' }  (igual que siembras; el backend libera el stock)
import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_RESERVATIONS } from '../../mocks/reservationMocks';

function fromReservationResponse(reservation) {
    return {
        reservationId: reservation.id,
        clientId: reservation.clientId,
        sowingId: reservation.sowingId,
        quantity: Number(reservation.quantity) || 0,
        reservationDate: toDateOnly(reservation.reservationDate),
        deliveryDate: toDateOnly(reservation.deliveryDate),
        status: reservation.status,
    };
}

function toReservationRequest(payload) {
    return {
        clientId: payload.clientId,
        sowingId: payload.sowingId,
        quantity: Number(payload.quantity),
        reservationDate: payload.reservationDate,
        deliveryDate: payload.deliveryDate,
    };
}

const findMock = (id) => MOCK_RESERVATIONS.find((r) => String(r.reservationId) === String(id));

export async function getReservations() {
    if (MOCK_CONFIG.reservations) {
        await mockDelay();
        return [...MOCK_RESERVATIONS];
    }

    const { data } = await axiosClient.get('/reservations');
    return data.map(fromReservationResponse);
}

export async function getReservationById(id) {
    if (MOCK_CONFIG.reservations) {
        await mockDelay();
        const reservation = findMock(id);
        if (!reservation) throw new Error('Reserva no encontrada');
        return reservation;
    }

    const { data } = await axiosClient.get(`/reservations/${id}`);
    return fromReservationResponse(data);
}

export async function createReservation(payload) {
    if (MOCK_CONFIG.reservations) {
        await mockDelay();
        const reservation = { reservationId: `r-${Date.now()}`, ...toReservationRequest(payload), status: 'RESERVED' };
        MOCK_RESERVATIONS.push(reservation);
        return reservation;
    }

    const { data } = await axiosClient.post('/reservations', toReservationRequest(payload));
    return fromReservationResponse(data);
}

export async function updateReservation(id, payload) {
    if (MOCK_CONFIG.reservations) {
        await mockDelay();
        return Object.assign(findMock(id), toReservationRequest(payload));
    }

    const { data } = await axiosClient.put(`/reservations/${id}`, toReservationRequest(payload));
    return fromReservationResponse(data);
}

export async function cancelReservation(id) {
    if (MOCK_CONFIG.reservations) {
        await mockDelay();
        return Object.assign(findMock(id), { status: 'CANCELLED' });
    }

    const { data } = await axiosClient.put(`/reservations/${id}/status`, { status: 'CANCELLED' });
    return fromReservationResponse(data);
}
