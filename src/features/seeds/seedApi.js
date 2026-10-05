import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SEEDS } from '../../mocks/seedMocks';

const FILTER_ENDPOINTS = {
    type: (value) => `/seeds/type/${encodeURIComponent(value)}`,
    supplier: (value) => `/seeds/supplier/${encodeURIComponent(value)}`,
    stock: (value) => `/seeds/stock-less/${encodeURIComponent(value)}`,
    name: (value) => `/seeds/name/${encodeURIComponent(value)}`,
};

function fromSeedResponse(seed, suppliers = []) {
    return {
        seedId: seed.id,
        name: seed.name,
        type: seed.type,
        description: seed.description ?? '',
        totalAvailable: seed.totalAvailable ?? 0,
        active: seed.active,
        createdDate: null,
        lastUpdated: null,
        supplierIds: suppliers.map((s) => s.id),
        supplierNames: suppliers.map((s) => s.name),
    };
}

function toSeedRequest(payload) {
    return {
        name: payload.name?.trim(),
        type: payload.type,
        description: payload.description?.trim() || null,
    };
}

async function fetchSuppliers() {
    const { data } = await axiosClient.get('/suppliers');
    return data;
}

async function fetchActiveSupplierIds(seedId) {
    const { data } = await axiosClient.get('/seed-suppliers', { params: { seedId } });
    return data.filter((link) => link.active !== false).map((link) => link.supplierId);
}

async function fetchSuppliersBySeed() {
    const suppliers = await fetchSuppliers();
    const linkGroups = await Promise.all(
        suppliers.map((supplier) =>
            axiosClient
                .get('/seed-suppliers', { params: { supplierId: supplier.id } })
                .then(({ data }) => data.filter((link) => link.active !== false))
        )
    );

    const suppliersById = new Map(suppliers.map((s) => [s.id, s]));
    const bySeed = new Map();
    linkGroups.flat().forEach((link) => {
        const supplier = suppliersById.get(link.supplierId);
        if (!supplier) return;
        const list = bySeed.get(link.seedId) ?? [];
        list.push(supplier);
        bySeed.set(link.seedId, list);
    });
    return bySeed;
}

async function fetchSeedsByFilter({ mode, value } = {}) {
    const buildUrl = FILTER_ENDPOINTS[mode];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

    if (!buildUrl || !hasValue) {
        const { data } = await axiosClient.get('/seeds');
        return data;
    }

    try {
        const { data } = await axiosClient.get(buildUrl(String(value).trim()));
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        if (mode === 'name' && error.response?.status === 404) return [];
        throw error;
    }
}

async function syncSuppliers(seedId, supplierIds) {
    const wanted = [...new Set(supplierIds.map(Number))];
    const current = await fetchActiveSupplierIds(seedId);

    const toLink = wanted.filter((id) => !current.includes(id));
    const toUnlink = current.filter((id) => !wanted.includes(id));

    await Promise.all([
        ...toLink.map((supplierId) =>
            axiosClient.post('/seed-suppliers', { seedId, supplierId })
        ),
        ...toUnlink.map((supplierId) =>
            axiosClient.delete('/seed-suppliers', { params: { seedId, supplierId } })
        ),
    ]);
}


export async function getSeeds(filter = { mode: '', value: '' }) {
    if (MOCK_CONFIG.seeds) {
        await mockDelay();
        return MOCK_SEEDS;
    }

    const [seeds, suppliersBySeed] = await Promise.all([
        fetchSeedsByFilter(filter),
        fetchSuppliersBySeed(),
    ]);

    return seeds.map((seed) => fromSeedResponse(seed, suppliersBySeed.get(seed.id) ?? []));
}

export const getAllSeeds = () => getSeeds();

export async function getSeedById(id) {
    const [{ data: seed }, suppliers, supplierIds] = await Promise.all([
        axiosClient.get(`/seeds/${id}`),
        fetchSuppliers(),
        fetchActiveSupplierIds(id),
    ]);

    const linked = suppliers.filter((s) => supplierIds.includes(s.id));
    return fromSeedResponse(seed, linked);
}

export async function createSeed(payload) {
    const { data: created } = await axiosClient.post('/seeds', toSeedRequest(payload));

    if (payload.supplierIds?.length) {
        await syncSuppliers(created.id, payload.supplierIds);
    }

    return getSeedById(created.id);
}

export async function updateSeed(id, payload) {
    await axiosClient.put(`/seeds/${id}`, toSeedRequest(payload));

    if (Array.isArray(payload.supplierIds)) {
        await syncSuppliers(Number(id), payload.supplierIds);
    }

    return getSeedById(id);
}