import axiosClient from '../../api/axiosClient';


export async function getSuppliers() {
    const { data } = await axiosClient.get('/suppliers');
    return data;
}

export async function createSupplier(payload) {
    const { data } = await axiosClient.post('/suppliers', payload);
    return data;
}
