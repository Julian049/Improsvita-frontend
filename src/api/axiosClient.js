import axios from 'axios';
import { getToken, clearToken } from './tokenStorage';

const BASE_URL =  import.meta.env.VITE_API_URL

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

function isTokenExpired(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return false;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

function redirectToLogin() {
    clearToken();
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

axiosClient.interceptors.request.use((config) => {
    const token = getToken();

    if (token && isTokenExpired(token)) {
        redirectToLogin();
        return Promise.reject(new axios.Cancel('Token expirado'));
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            redirectToLogin();
        }
        return Promise.reject(error);
    }
);

export default axiosClient;