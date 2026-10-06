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

// El backend guarda una única fila por (semilla, proveedor) y desvincular solo la desactiva:
// volver a vincular ese par choca con la restricción única, así que esos proveedores quedan bloqueados.
async function fetchSupplierLinks(seedId) {
    const { data } = await axiosClient.get('/seed-suppliers', { params: { seedId } });
    const activeIds = data.filter((link) => link.active).map((link) => link.supplierId);
    const blockedIds = data
        .filter((link) => !link.active && !activeIds.includes(link.supplierId))
        .map((link) => link.supplierId);
    return { activeIds, blockedIds };
}

export async function getActiveSupplierIdsBySeed(seedId) {
    const { activeIds } = await fetchSupplierLinks(seedId);
    return activeIds;
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
    const { activeIds: current, blockedIds } = await fetchSupplierLinks(seedId);

    const toLink = wanted.filter((id) => !current.includes(id));
    if (toLink.some((id) => blockedIds.includes(id))) {
        const error = new Error('Uno de los proveedores ya fue desvinculado de esta semilla y no se puede volver a vincular.');
        error.userMessage = error.message;
        throw error;
    }
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

// Solo GET /seeds (sin cruzar proveedores): para vistas que únicamente necesitan nombres.
export async function getSeedCatalog() {
    if (MOCK_CONFIG.seeds) {
        await mockDelay();
        return MOCK_SEEDS;
    }

    const { data } = await axiosClient.get('/seeds');
    return data.map((seed) => fromSeedResponse(seed));
}

export async function getSeedById(id) {
    const [{ data: seed }, suppliers, { activeIds, blockedIds }] = await Promise.all([
        axiosClient.get(`/seeds/${id}`),
        fetchSuppliers(),
        fetchSupplierLinks(id),
    ]);

    const linked = suppliers.filter((s) => activeIds.includes(s.id));
    return { ...fromSeedResponse(seed, linked), blockedSupplierIds: blockedIds };
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

function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
}

// DELETE /seeds/{id} borra la fila; si hay lotes o vínculos con proveedores la BD lo rechaza y el
// backend responde 403 (el interceptor lo trataría como sesión caída), así que se valida antes.
// Los vínculos desactivados también cuentan: siguen existiendo y el backend no permite borrarlos.
export async function deleteSeed(id) {
    const [{ data: lots }, { data: links }] = await Promise.all([
        axiosClient.get('/inventory/lots', { params: { seedId: id } }),
        axiosClient.get('/seed-suppliers', { params: { seedId: id } }),
    ]);

    if (lots.length > 0 || links.length > 0) {
        const reasons = [
            lots.length > 0 && pluralize(lots.length, 'lote', 'lotes'),
            links.length > 0 && pluralize(links.length, 'vínculo con proveedores', 'vínculos con proveedores'),
        ].filter(Boolean);
        const error = new Error(
            `No se puede eliminar: la semilla tiene ${reasons.join(' y ')}. Solo se pueden eliminar semillas que nunca tuvieron lotes ni proveedores.`
        );
        error.userMessage = error.message;
        throw error;
    }

    await axiosClient.delete(`/seeds/${id}`);
}
