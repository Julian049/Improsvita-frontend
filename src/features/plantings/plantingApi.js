import axiosClient from '../../api/axiosClient';
import { toDateOnly, toIsoDateTime } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_PLANTINGS } from '../../mocks/plantingMocks';
import { PLANTING_STATUS } from './plantingStatus';

function toId(value) {
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? value : asNumber;
}

function toPlantingRequest(payload) {
    const frequency = String(payload.fumigationFrequencyDays ?? '').trim();
    return {
        seedId: toId(payload.seedId),
        quantity: Number(payload.quantity),
        plantingDate: toIsoDateTime(payload.plantingDate),
        estimatedHarvestDate: toIsoDateTime(payload.harvestDate),
        fumigationFrequencyDays: frequency ? Number(frequency) : null,
        observations: payload.observations?.trim() || null,
    };
}

function fromPlantingResponse(planting) {
    return {
        plantingId: planting.plantingId ?? planting.plantingId,
        lotId: planting.lotId ?? planting.lot?.lotId,
        bedId: planting.bedId ?? planting.bed?.bedId,
        quantitySown: Number(planting.quantitySown) || 0,
        germinatedQuantity: Number(planting.germinatedQuantity) || 0,
        plantingDate: toDateOnly(planting.plantingDate),
        expectedGerminationDate: toDateOnly(planting.expectedGerminationDate),
        status: planting.status,
        notes: planting.notes ?? '',
        active: planting.active,
    };
}

function findMockPlanting(id) {
    const index = MOCK_PLANTINGS.findIndex((p) => String(p.plantingId) === String(id));
    if (index === -1) throw new Error('Siembra no encontrada');
    return index;
}

export async function createPlanting(payload) {
    const request = toPlantingRequest(payload);

    const { data } = await axiosClient.post('/plantings', request);
    return fromPlantingResponse(data);
}

export async function getAllPlantings() {
    if (MOCK_CONFIG.plantings) {
        await mockDelay();
        return MOCK_PLANTINGS.map(fromPlantingResponse);
    }

    const { data } = await axiosClient.get('/plantings');
    return data.map(fromPlantingResponse);
}

export async function updatePlantingStatus(id, status) {
    if (MOCK_CONFIG.plantings) {
        await mockDelay();
        const index = findMockPlanting(id);
        const current = MOCK_PLANTINGS[index];
        const next = { ...current, status };
        
        if (
            status === PLANTING_STATUS.GERMINATED &&
            current.germinatedQuantity < current.quantitySown * 0.8
        ) {
            next.germinatedQuantity = Math.round(current.quantitySown * 0.85);
        }

        MOCK_PLANTINGS[index] = next;
        return fromPlantingResponse(next);
    }

    const { data } = await axiosClient.patch(`/plantings/${id}/status`, { status });
    return fromPlantingResponse(data);
}

export async function updatePlantingActive(id, active) {
    if (MOCK_CONFIG.plantings) {
        await mockDelay();
        const index = findMockPlanting(id);
        MOCK_PLANTINGS[index] = { ...MOCK_PLANTINGS[index], active };
        return fromPlantingResponse(MOCK_PLANTINGS[index]);
    }

    const { data } = await axiosClient.patch(`/plantings/${id}/active`, { active });
    return fromPlantingResponse(data);
}