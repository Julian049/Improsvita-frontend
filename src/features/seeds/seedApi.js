import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SEEDS } from '../../mocks/seedMocks';

function fromSeedResponse(seed) {
    const suppliers = seed.suppliers ?? [];
    return {
        seedId: seed.seedId,
        name: seed.name,
        type: seed.type,
        description: seed.description ?? '',
        active: seed.active,
        createdDate: toDateOnly(seed.createdDate),
        lastUpdated: toDateOnly(seed.lastUpdated),
        supplierIds: seed.supplierIds ?? suppliers.map((s) => s.supplierId),
        supplierNames: suppliers.map((s) => s.name),
    };
}

function toSeedRequest(payload) {
    return {
        name: payload.name,
        type: payload.type,
        description: payload.description || null,
        supplierIds: payload.supplierIds.map(Number),
        ...(payload.active !== undefined && { active: payload.active }),
    };
}

export async function getAllSeeds() {
    if (MOCK_CONFIG.seeds) {
        await mockDelay();
        return MOCK_SEEDS;
    }

    const { data } = await axiosClient.get('/seeds');
    return data.map(fromSeedResponse);
}

export async function getSeedById(id) {
    const { data } = await axiosClient.get(`/seeds/${id}`);
    return fromSeedResponse(data);
}

export async function createSeed(payload) {
    const { data } = await axiosClient.post('/seeds', toSeedRequest(payload));
    return fromSeedResponse(data);
}

export async function updateSeed(id, payload) {
    const { data } = await axiosClient.put(`/seeds/${id}`, toSeedRequest(payload));
    return fromSeedResponse(data);
}