import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_BEDS } from '../../mocks/bedMocks';

function fromBedResponse(bed) {
    return {
        bedId: bed.id,
        code: bed.code,
        maxCapacity: Number(bed.maxCapacity) || 0,
        active: bed.active,
    };
}

function toBedRequest(payload) {
    const capacity = String(payload.maxCapacity ?? '').trim();
    return {
        code: payload.code.trim(),
        maxCapacity: capacity ? Number(capacity) : null,
        active: payload.active,
    };
}

export async function getBeds() {
    if (MOCK_CONFIG.beds) {
        await mockDelay();
        return MOCK_BEDS;
    }

    const { data } = await axiosClient.get('/beds');
    return data.map(fromBedResponse);
}

export async function getBedById(id) {
    const { data } = await axiosClient.get(`/beds/${id}`);
    return fromBedResponse(data);
}

export async function getBedByCode(code) {
    try {
        const { data } = await axiosClient.get(`/beds/code/${encodeURIComponent(code)}`);
        return fromBedResponse(data);
    } catch (error) {
        if (error.response?.status === 404) return null;
        throw error;
    }
}

// El backend crea siempre la cama activa e ignora `active` en el POST.
export async function createBed(payload) {
    const { data } = await axiosClient.post('/beds', toBedRequest(payload));
    return fromBedResponse(data);
}

export async function updateBed(id, payload) {
    const { data } = await axiosClient.put(`/beds/${id}`, toBedRequest(payload));
    return fromBedResponse(data);
}
