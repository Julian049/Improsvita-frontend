import axiosClient from '../../api/axiosClient';

function fromSeedTypeResponse(seedType) {
    return {
        seedTypeId: seedType.id,
        name: seedType.name,
        description: seedType.description ?? '',
    };
}

function toSeedTypeRequest(payload) {
    return {
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
    };
}

export async function getSeedTypes() {
    const { data } = await axiosClient.get('/seed-types');
    return data.map(fromSeedTypeResponse);
}

export async function getSeedTypeById(id) {
    const { data } = await axiosClient.get(`/seed-types/${id}`);
    return fromSeedTypeResponse(data);
}

export async function createSeedType(payload) {
    const { data } = await axiosClient.post('/seed-types', toSeedTypeRequest(payload));
    return fromSeedTypeResponse(data);
}

export async function updateSeedType(id, payload) {
    const { data } = await axiosClient.put(`/seed-types/${id}`, toSeedTypeRequest(payload));
    return fromSeedTypeResponse(data);
}

// El backend responde 409 si el tipo tiene semillas asociadas (el mensaje llega en el cuerpo).
export async function deleteSeedType(id) {
    await axiosClient.delete(`/seed-types/${id}`);
}