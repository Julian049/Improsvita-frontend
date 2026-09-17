import axiosClient from '../../api/axiosClient';

export async function getAllSeeds() {
    const { data } = await axiosClient.get('/seeds');
    return data; // [{ id, plantName, variety, supplierId, quantity, acquisitionDate, expirationDate, notes }, ...]
}

export async function getSeedById(id) {
    const { data } = await axiosClient.get(`/seeds/${id}`);
    return data;
}

export async function createSeed(payload) {
    const { data } = await axiosClient.post('/seeds', payload);
    return data;
}

export async function updateSeed(id, payload) {
    const { data } = await axiosClient.put(`/seeds/${id}`, payload);
    return data;
}

export async function getSuppliers() {
    const { data } = await axiosClient.get('/suppliers');
    return data; // [{ id, name }, ...]
}
