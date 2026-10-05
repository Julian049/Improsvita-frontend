import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_PLANTINGS } from '../../mocks/plantingMocks';

const FILTER_PARAMS = ['lotId', 'bedId', 'bedCode', 'status'];

function toSowRequest(payload) {
    return {
        lotId: Number(payload.lotId),
        bedId: Number(payload.bedId),
        quantity: Number(payload.quantity),
        sowingDate: payload.sowingDate || null,
        expectedGerminationDate: payload.expectedGerminationDate || null,
        notes: payload.notes?.trim() || null,
    };
}

function fromSowingResponse(sowing) {
    return {
        plantingId: sowing.id,
        lotId: sowing.lotId,
        bedId: sowing.bedId,
        quantitySown: Number(sowing.quantitySown) || 0,
        germinatedQuantity: Number(sowing.germinatedQuantity) || 0,
        germinationRate: sowing.germinationRate == null ? null : Number(sowing.germinationRate),
        sowingDate: toDateOnly(sowing.sowingDate),
        expectedGerminationDate: toDateOnly(sowing.expectedGerminationDate),
        status: sowing.status,
        notes: sowing.notes ?? '',
    };
}

export async function getPlantings({ mode, value } = {}) {
    if (MOCK_CONFIG.plantings) {
        await mockDelay();
        return MOCK_PLANTINGS;
    }

    const params = FILTER_PARAMS.includes(mode) && value ? { [mode]: value } : undefined;
    const { data } = await axiosClient.get('/sowings', { params });
    return data.map(fromSowingResponse);
}

export const getAllPlantings = () => getPlantings();

export async function createPlanting(payload) {
    const { data } = await axiosClient.post('/sowings', toSowRequest(payload));
    return fromSowingResponse(data);
}

export async function updatePlantingStatus(id, status) {
    const { data } = await axiosClient.put(`/sowings/${id}/status`, { status });
    return fromSowingResponse(data);
}

export async function updatePlantingGermination(id, germinatedQuantity) {
    const { data } = await axiosClient.put(`/sowings/${id}/germination`, {
        germinatedQuantity: Number(germinatedQuantity),
    });
    return fromSowingResponse(data);
}
