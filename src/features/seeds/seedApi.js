import axiosClient from '../../api/axiosClient';
import { MOCK_SEEDS, MOCK_SUPPLIERS } from './seedMockData';

//Esta linea es temporal, se mockea la vista
//Cada bloque if tambien es temporal junto al import
const USE_MOCK_DATA = true;

export async function getAllSeeds() {
    if (USE_MOCK_DATA) return Promise.resolve(MOCK_SEEDS);
    
    const { data } = await axiosClient.get('/seeds');
    return data; // [{ id, plantName, variety, supplierId, quantity, acquisitionDate, expirationDate, notes }, ...]
}

export async function getSeedById(id) {
    if (USE_MOCK_DATA) {
        const seed = MOCK_SEEDS.find((s) => String(s.id) === String(id));
        return Promise.resolve(seed);
    }

    const { data } = await axiosClient.get(`/seeds/${id}`);
    return data;
}

export async function createSeed(payload) {
    if (USE_MOCK_DATA) {
        console.log('[MOCK] createSeed payload:', payload);
        return Promise.resolve({ id: Date.now(), ...payload });
    }

    const { data } = await axiosClient.post('/seeds', payload);
    return data;
}

export async function updateSeed(id, payload) {
    if (USE_MOCK_DATA) {
        console.log('[MOCK] updateSeed', id, payload);
        return Promise.resolve({ id, ...payload });
    }

    const { data } = await axiosClient.put(`/seeds/${id}`, payload);
    return data;
}

export async function getSuppliers() {
    if (USE_MOCK_DATA) return Promise.resolve(MOCK_SUPPLIERS);

    const { data } = await axiosClient.get('/suppliers');
    return data; // [{ id, name }, ...]
}
