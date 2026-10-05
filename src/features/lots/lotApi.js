import axiosClient from '../../api/axiosClient';
import { toDateOnly, toIsoDateTime } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_LOTS } from '../../mocks/lotMocks';

function fromLotResponse(lot) {
    return {
        lotId: lot.id,
        seedId: lot.seedId,
        locationId: lot.locationId,
        lotNumber: lot.lotNumber,
        entryDate: toDateOnly(lot.entryDate),
        dueDate: toDateOnly(lot.dueDate),
        initialQuantity: lot.initialQuantity,
        availableQuantity: lot.availableQuantity,
        status: lot.status,
    };
}

function fromMovementResponse(movement) {
    return {
        movementId: movement.id,
        lotId: movement.lotId,
        supplierId: movement.supplierId,
        movementType: movement.movementType,
        quantity: Number(movement.quantity) || 0,
        movementDate: toDateOnly(movement.movementDate),
        reason: movement.reason ?? '',
    };
}

function toLotRequest(payload) {
    return {
        seedId: Number(payload.seedId),
        locationId: Number(payload.locationId),
        lotNumber: Number(payload.lotNumber),
        entryDate: toIsoDateTime(payload.entryDate),
        dueDate: toIsoDateTime(payload.dueDate),
        initialQuantity: Number(payload.initialQuantity),
    };
}

const FILTER_PARAMS = ['seedId', 'locationId', 'status'];

// El backend aplica un solo filtro por petición (prioridad seedId > locationId > status).
export async function getLots({ mode, value } = {}) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        return MOCK_LOTS;
    }

    const params = FILTER_PARAMS.includes(mode) && value ? { [mode]: value } : undefined;
    const { data } = await axiosClient.get('/inventory/lots', { params });
    return data.map(fromLotResponse);
}

export const getAllLots = () => getLots();

export async function getLotById(id) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        const found = MOCK_LOTS.find((l) => String(l.lotId) === String(id));
        if (!found) throw new Error('Lote no encontrado');
        return found;
    }

    const { data } = await axiosClient.get(`/inventory/lots/${id}`);
    return fromLotResponse(data);
}

export async function getLotKardex(lotId) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        return [];
    }

    const { data } = await axiosClient.get(`/inventory/lots/${lotId}/kardex`);
    return data.map(fromMovementResponse);
}

export async function createLot(payload) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        const newLot = {
            lotId: Date.now(),
            ...toLotRequest(payload),
            availableQuantity: Number(payload.initialQuantity),
            status: 'AVAILABLE',
        };
        MOCK_LOTS.push(newLot);
        return newLot;
    }

    const { data } = await axiosClient.post('/lots', toLotRequest(payload));
    return fromLotResponse(data);
}

export async function updateLot(id, payload) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        const index = MOCK_LOTS.findIndex((l) => String(l.lotId) === String(id));
        if (index !== -1) {
            MOCK_LOTS[index] = { ...MOCK_LOTS[index], ...toLotRequest(payload) };
            return MOCK_LOTS[index];
        }
    }

    const { data } = await axiosClient.put(`/lots/${id}`, toLotRequest(payload));
    return fromLotResponse(data);
}