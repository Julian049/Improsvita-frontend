import axiosClient from './axiosClient';


export async function loginRequest({ email, password }) {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    return data;
}

export async function registerRequest({ name, email, password }) {
    const { data } = await axiosClient.post('/auth/register', { name, email, password });
    return data;
}