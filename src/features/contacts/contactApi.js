import axiosClient from '../../api/axiosClient';

export const CONTACT_ROLE = {
    SUPPLIER: 'SUPPLIER',
    CLIENT: 'CLIENT',
    EMPLOYEE: 'EMPLOYEE',
};

function fromContactResponse(contact) {
    return {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        active: contact.active,
        roles: contact.roles ?? [],
    };
}

function toContactRequest(payload) {
    return {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        roles: payload.roles,
    };
}

export async function getContacts(role, includeInactive = false) {
    const params = {};
    if (role) params.role = role;
    if (includeInactive) params.includeInactive = true;
    const { data } = await axiosClient.get('/contacts', { params });
    return data.map(fromContactResponse);
}

export async function getContactById(id) {
    const { data } = await axiosClient.get(`/contacts/${id}`);
    return fromContactResponse(data);
}

export async function createContact(payload) {
    const { data } = await axiosClient.post('/contacts', toContactRequest(payload));
    return fromContactResponse(data);
}

export async function updateContact(id, payload) {
    const { data } = await axiosClient.put(`/contacts/${id}`, toContactRequest(payload));
    return fromContactResponse(data);
}

export async function deactivateContact(id) {
    await axiosClient.delete(`/contacts/${id}`);
}
