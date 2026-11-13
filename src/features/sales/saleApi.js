import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SALES } from '../../mocks/saleMocks';

function toSaleRequest(payload) {
    return {
        contactId: Number(payload.clientId),
        sowingId: Number(payload.sowingId),
        quantity: Number(payload.quantity),
        unitPrice: Number(payload.unitPrice),
        saleDate: payload.saleDate || null,
        notes: payload.notes?.trim() || null,
    };
}

export async function createSale(payload) {
    const request = toSaleRequest(payload);

    if (MOCK_CONFIG.sales) {
        await mockDelay();
        const sale = {
            id: `s-${MOCK_SALES.length + 1}`,
            ...request,
            total: request.quantity * request.unitPrice,
            saleType: 'DIRECT',
            active: true,
        };
        MOCK_SALES.push(sale);
        return sale;
    }

    const { data } = await axiosClient.post('/sales', request);
    return data;
}

export async function getSales(filters = {}) {
    const params = {};
    if (filters.contactId != null) params.contactId = filters.contactId;
    if (filters.type) params.type = filters.type;
    if (filters.from) params.from = toDateOnly(filters.from);
    if (filters.to) params.to = toDateOnly(filters.to);

    if (MOCK_CONFIG.sales) {
        await mockDelay();
        return MOCK_SALES.filter((sale) => {
            const saleDate = toDateOnly(sale.saleDate);
            return (!params.from || saleDate >= params.from) && (!params.to || saleDate <= params.to);
        });
    }

    const { data } = await axiosClient.get('/sales', {
        params: Object.keys(params).length ? params : undefined,
    });
    return data;
}

export async function getSaleAvailability(sowingId) {
    const { data } = await axiosClient.get(`/sales/availability/${sowingId}`);
    return data;
}

export async function deliverReservation({ reservationId, quantity, unitPrice, saleDate, notes }) {
    const { data } = await axiosClient.post('/sales/reservation', {
        reservationId: Number(reservationId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        saleDate: saleDate || null,
        notes: notes?.trim() || null,
    });
    return data;
}
