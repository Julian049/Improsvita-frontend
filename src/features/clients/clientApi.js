import axiosClient from '../../api/axiosClient';

function fromClientResponse(client) {
    return {
        clientId: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        active: client.active,
    };
}

export async function getClients() {
    const { data } = await axiosClient.get('/clients');
    return data.map(fromClientResponse);
}

export async function getClientById(id) {
    const { data } = await axiosClient.get(`/clients/${id}`);
    return fromClientResponse(data);
}
