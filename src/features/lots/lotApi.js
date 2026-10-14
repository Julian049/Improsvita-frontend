import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_LOTS } from '../../mocks/lotMocks';

function fromLotResponse(lot) {
    return {
        lotId: lot.id,
        seedId: lot.seedId,
        locationId: lot.locationId,
        germinationPercentage: lot.germinationPercentage ?? null,
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

// EntryRequest del backend: entryDate vacía la toma como hoy. El formulario ya no pide dueDate.
function toEntryRequest(payload) {
    return {
        seedId: Number(payload.seedId),
        supplierId: Number(payload.supplierId),
        locationId: Number(payload.locationId),
        lotNumber: Number(payload.lotNumber),
        quantity: Number(payload.quantity),
        germinationPercentage: payload.germinationPercentage === '' ? null : Number(payload.germinationPercentage),
        entryDate: payload.entryDate || null,
        dueDate: null,
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

export async function getLotById(id) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        return MOCK_LOTS.find((lot) => String(lot.lotId) === String(id));
    }

    const { data } = await axiosClient.get(`/inventory/lots/${id}`);
    return fromLotResponse(data);
}

// Semilla, proveedor y cantidad no se editan: la cantidad cambia solo con movimientos (kardex).
function toLotUpdateRequest(payload) {
    return {
        locationId: Number(payload.locationId),
        lotNumber: Number(payload.lotNumber),
        germinationPercentage: payload.germinationPercentage === '' ? null : Number(payload.germinationPercentage),
        entryDate: payload.entryDate || null,
    };
}

// Pendiente del backend: aún no existe PUT /inventory/lots/{id}; queda listo para cuando la API lo exponga.
export async function updateLot(id, payload) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        const lot = MOCK_LOTS.find((l) => String(l.lotId) === String(id));
        Object.assign(lot, toLotUpdateRequest(payload));
        return lot;
    }

    try {
        const { data } = await axiosClient.put(`/inventory/lots/${id}`, toLotUpdateRequest(payload));
        return fromLotResponse(data);
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
            err.userMessage = 'El servidor todavía no permite editar lotes.';
        }
        throw err;
    }
}
