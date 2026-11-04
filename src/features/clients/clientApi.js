import { CONTACT_ROLE, getContactById, getContacts } from '../contacts/contactApi';

function fromClientResponse(contact) {
    return {
        clientId: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        active: contact.active,
    };
}

export async function getClients() {
    const contacts = await getContacts(CONTACT_ROLE.CLIENT);
    return contacts.map(fromClientResponse);
}

export async function getClientById(id) {
    return fromClientResponse(await getContactById(id));
}
