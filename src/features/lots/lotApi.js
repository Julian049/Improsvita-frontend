import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
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

// EntryRequest del backend: entryDate vacía la toma como hoy; dueDate es opcional.
function toEntryRequest(payload) {
    return {
        seedId: Number(payload.seedId),
        supplierId: Number(payload.supplierId),
        locationId: Number(payload.locationId),
        lotNumber: Number(payload.lotNumber),
        quantity: Number(payload.quantity),
        entryDate: payload.entryDate || null,
        dueDate: payload.dueDate || null,
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
        const request = toEntryRequest(payload);
        const newLot = {
            lotId: Date.now(),
            ...request,
            initialQuantity: request.quantity,
            availableQuantity: request.quantity,
            status: 'AVAILABLE',
        };
        MOCK_LOTS.push(newLot);
        return newLot;
    }

    const { data } = await axiosClient.post('/inventory/entries', toEntryRequest(payload));
    return fromLotResponse(data);
}
