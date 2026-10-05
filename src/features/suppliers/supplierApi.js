import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SUPPLIERS } from '../../mocks/supplierMocks';

function fromSupplierResponse(supplier) {
    return {
        supplierId: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
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
    if (MOCK_CONFIG.suppliers) {
        await mockDelay();
        return MOCK_SUPPLIERS;
    }

    const { data } = await axiosClient.get('/suppliers');
    return data.map(fromSupplierResponse);
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
    const { data } = await axiosClient.post('/suppliers', toSupplierRequest(payload));
    return fromSupplierResponse(data);
}