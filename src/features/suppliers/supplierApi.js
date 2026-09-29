import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';

function fromSupplierResponse(supplier) {
    return {
        supplierId: supplier.supplierId,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        active: supplier.active,
        createdDate: toDateOnly(supplier.createdDate),
        lastUpdated: toDateOnly(supplier.lastUpdated),
    };
}

function toSupplierRequest(payload) {
    return {
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
    };
}

export async function getSuppliers() {
    const { data } = await axiosClient.get('/suppliers');
    return data.map(fromSupplierResponse);
}

export async function createSupplier(payload) {
    const { data } = await axiosClient.post('/suppliers', toSupplierRequest(payload));
    return fromSupplierResponse(data);
}