import axiosClient from '../../api/axiosClient';
import { toDateOnly, toIsoDateTime } from '../../utils/dateUtils';

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
        plantingId: planting.plantingId,
        seedId: planting.seedId,
        quantity: planting.quantity,
        plantingDate: toDateOnly(planting.plantingDate),
        estimatedHarvestDate: toDateOnly(planting.estimatedHarvestDate),
        fumigationFrequencyDays: planting.fumigationFrequencyDays ?? null,
        observations: planting.observations ?? '',
        status: planting.status,
        registeredAt: planting.registeredAt ?? planting.createdAt,
        discountedQuantity: planting.discountedQuantity ?? planting.quantity,
    };
}

export async function createPlanting(payload) {
    const request = toPlantingRequest(payload);

    const { data } = await axiosClient.post('/plantings', request);
    return fromPlantingResponse(data);
}