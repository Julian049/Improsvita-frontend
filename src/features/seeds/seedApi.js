import axiosClient from '../../api/axiosClient';

function toIsoDateTime(dateOnlyString) {
    if (!dateOnlyString) return null;
    return `${dateOnlyString}T00:00:00`;
}

function toDateOnly(isoDateTimeString) {
    if (!isoDateTimeString) return '';
    return isoDateTimeString.slice(0, 10);
}

function fromSeedResponse(seed) {
    return {
        id: seed.id,
        name: seed.name,
        type: seed.type,
        supplierId: seed.supplier ? String(seed.supplier.id) : '',
        supplierName: seed.supplier ? seed.supplier.name : '',
        quantity: seed.quantity,
        acquisitionDate: toDateOnly(seed.acquisitionDate),
        expirationDate: toDateOnly(seed.expirationDate),
        active: seed.active,
    };
}

function toSeedRequest(payload) {
    return {
        name: payload.name,
        supplierId: Number(payload.supplierId),
        quantity: Number(payload.quantity),
        type: payload.type,
        acquisitionDate: toIsoDateTime(payload.acquisitionDate),
        expirationDate: toIsoDateTime(payload.expirationDate),
    };
}

export async function getAllSeeds() {
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

export async function getSuppliers() {
    const { data } = await axiosClient.get('/suppliers');
    return data; // [{ id, name, phone, email }, ...]
}