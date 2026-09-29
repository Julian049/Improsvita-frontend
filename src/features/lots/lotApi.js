import axiosClient from '../../api/axiosClient';
import { toDateOnly, toIsoDateTime } from '../../utils/dateUtils';

function fromLotResponse(lot) {
    return {
        lotId: lot.lotId,
        seedId: lot.seedId ?? lot.seed?.seedId,
        seedName: lot.seed?.name ?? '',
        locationId: lot.locationId ?? lot.location?.locationId,
        locationName: lot.location?.locationName ?? '',
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
    const { data } = await axiosClient.get('/lots');
    return data.map(fromLotResponse);
}

export async function getLotById(id) {
    const { data } = await axiosClient.get(`/lots/${id}`);
    return fromLotResponse(data);
}

export async function createLot(payload) {
    const { data } = await axiosClient.post('/lots', toLotRequest(payload));
    return fromLotResponse(data);
}

export async function updateLot(id, payload) {
    const { data } = await axiosClient.put(`/lots/${id}`, toLotRequest(payload));
    return fromLotResponse(data);
}