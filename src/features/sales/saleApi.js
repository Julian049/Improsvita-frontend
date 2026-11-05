import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SALES } from '../../mocks/saleMocks';

function toSaleRequest(payload) {
    return {
        clientId: Number(payload.clientId),
        sowingId: Number(payload.sowingId),
        quantity: Number(payload.quantity),
        totalPrice: Number(payload.totalPrice),
        saleDate: payload.saleDate || null,
        notes: payload.notes?.trim() || null,
    };
}

// SUPUESTO: aún no existe POST /sales; el body y la respuesta son una suposición.
export async function createSale(payload) {
    const request = toSaleRequest(payload);

    if (MOCK_CONFIG.sales) {
        await mockDelay();
        const sale = { id: `s-${MOCK_SALES.length + 1}`, ...request };
        MOCK_SALES.push(sale);
        return sale;
    }

    try {
        const { data } = await axiosClient.post('/sales', request);
        return data;
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
            err.userMessage = 'El servidor todavía no permite registrar ventas.';
        }
        throw err;
    }
}

// SUPUESTO: aún no existe GET /sales.
export async function getSales() {
    if (MOCK_CONFIG.sales) {
        await mockDelay();
        return [...MOCK_SALES];
    }

    const { data } = await axiosClient.get('/sales');
    return data;
}
