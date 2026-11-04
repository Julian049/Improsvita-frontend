import axiosClient from '../../api/axiosClient';
import {
    CONTACT_ROLE,
    createContact,
    getContactById,
    getContacts,
    updateContact,
} from '../contacts/contactApi';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SUPPLIERS } from '../../mocks/supplierMocks';

function fromContactResponse(contact) {
    return {
        supplierId: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
    };
}

function toContactRequest(payload, roles) {
    return {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        roles,
    };
}

export async function getSuppliers() {
    if (MOCK_CONFIG.suppliers) {
        await mockDelay();
        return MOCK_SUPPLIERS;
    }

    const contacts = await getContacts(CONTACT_ROLE.SUPPLIER, true);
    return contacts.map(fromContactResponse);
}

export async function getSupplierById(id) {
    if (MOCK_CONFIG.suppliers) {
        await mockDelay();
        const supplier = MOCK_SUPPLIERS.find((s) => String(s.supplierId) === String(id));
        if (!supplier) throw new Error('Proveedor no encontrado');
        return supplier;
    }

    const contact = await getContactById(id);
    if (!contact.roles.includes(CONTACT_ROLE.SUPPLIER)) {
        throw new Error('Proveedor no encontrado');
    }
    return fromContactResponse(contact);
}

export async function getSupplierByName(name) {
    const suppliers = await getSuppliers();
    return suppliers.find((supplier) => supplier.name === name) ?? null;
}

export async function getSeedCountsBySupplier(supplierIds) {
    if (MOCK_CONFIG.suppliers) {
        await mockDelay();
        return new Map();
    }

    const entries = await Promise.all(
        supplierIds.map((id) =>
            axiosClient.get(`/seeds/supplier/${id}`).then(({ data }) => [String(id), data.length])
        )
    );
    return new Map(entries);
}

export async function createSupplier(payload) {
    const created = await createContact(
        toContactRequest(payload, [CONTACT_ROLE.SUPPLIER])
    );
    return fromContactResponse(created);
}

export async function updateSupplier(id, payload) {
    const current = await getContactById(id);
    const roles = current.roles.includes(CONTACT_ROLE.SUPPLIER)
        ? current.roles
        : [...current.roles, CONTACT_ROLE.SUPPLIER];

    const updated = await updateContact(id, toContactRequest(payload, roles));
    return fromContactResponse(updated);
}
