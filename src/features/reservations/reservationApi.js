import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';

function fromReservationResponse(reservation) {
    return {
        reservationId: reservation.id,
        clientId: reservation.clientId,
        sowingId: reservation.sowingId,
        totalPrice: Number(reservation.totalPrice) || 0,
        reservationDate: toDateOnly(reservation.reservationDate),
        status: reservation.reservationStatus,
        notes: reservation.notes ?? '',
        active: reservation.active,
    };
}

function toReservationRequest(payload) {
    return {
        clientId: Number(payload.clientId),
        sowingId: Number(payload.sowingId),
        reservationDate: payload.reservationDate || null,
        totalPrice: Number(payload.totalPrice),
        reservationStatus: payload.status || null,
        notes: payload.notes?.trim() || null,
    };
}

export async function getReservations(filters = {}) {
    const params = {};
    if (filters.sowingId) params.sowingId = filters.sowingId;
    if (filters.clientId) params.clientId = filters.clientId;
    if (filters.status) params.status = filters.status;

    const { data } = await axiosClient.get('/reservations', {
        params: Object.keys(params).length ? params : undefined,
    });
    return data.map(fromReservationResponse);
}

export async function getReservationById(id) {
    const { data } = await axiosClient.get(`/reservations/${id}`);
    return fromReservationResponse(data);
}

export async function createReservation(payload) {
    const { data } = await axiosClient.post('/reservations', toReservationRequest(payload));
    return fromReservationResponse(data);
}

export async function updateReservation(id, payload) {
    const { data } = await axiosClient.put(`/reservations/${id}`, toReservationRequest(payload));
    return fromReservationResponse(data);
}

export async function changeReservationStatus(id, status) {
    const { data } = await axiosClient.patch(`/reservations/${id}/status`, { status });
    return fromReservationResponse(data);
}

export async function cancelReservation(id) {
    return changeReservationStatus(id, 'CANCELLED');
}
