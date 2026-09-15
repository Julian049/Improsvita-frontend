import axiosClient from './axiosClient';


export async function loginRequest({ email, password }) {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    return data;
}

export async function logoutRequest() {
    try {
        await axiosClient.post('/auth/logout');
    } catch { /* empty */ }
}

export async function getCurrentUserRequest() {
    const { data } = await axiosClient.get('/auth/me');
    return data;
}