import axiosClient from '../../api/axiosClient';
import { toDateOnly, toIsoDateTime } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_LOTS } from '../../mocks/lotMocks';

function fromLotResponse(lot) {
    return {
        lotId: lot.lotId,
        seedId: lot.seedId ?? lot.seed?.seedId,
        seedName: lot.seedName ?? lot.seed?.name ?? '',
        locationId: lot.locationId ?? lot.location?.locationId,
        locationName: lot.locationName ?? lot.location?.locationName ?? '',
        lotNumber: lot.lotNumber,
        entryDate: toDateOnly(lot.entryDate),
        dueDate: toDateOnly(lot.dueDate),
        initialQuantity: lot.initialQuantity,
        availableQuantity: lot.availableQuantity,
        status: lot.status,
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

export async function getAllLots() {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        return MOCK_LOTS.map(fromLotResponse);
    }

    const { data } = await axiosClient.get('/lots');
    return data.map(fromLotResponse);
}

export async function getLotById(id) {
    if (MOCK_CONFIG.lots) {
        await mockDelay();
        const found = MOCK_LOTS.find((l) => String(l.lotId) === String(id));
        if (!found) throw new Error('Lote no encontrado');
        return fromLotResponse(found);
    }

    const { data } = await axiosClient.get(`/lots/${id}`);
    return fromLotResponse(data);
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
        return fromLotResponse(newLot);
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
            return fromLotResponse(MOCK_LOTS[index]);
        }
    }

    const { data } = await axiosClient.put(`/lots/${id}`, toLotRequest(payload));
    return fromLotResponse(data);
}