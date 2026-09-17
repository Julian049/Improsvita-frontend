import { createContext, useContext, useState } from 'react';
import {
    getToken,
    setToken as saveToken,
    clearToken,
    getStoredUser,
    setStoredUser,
} from '../api/tokenStorage';
import { loginRequest, registerRequest } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const token = getToken();
        return token ? getStoredUser() : null;
    });
    const [isLoading] = useState(false);
    const [error, setError] = useState(null);

    function applyAuthResponse(data) {
        const loggedUser = { email: data.email, role: data.role };
        saveToken(data.token);
        setStoredUser(loggedUser);
        setUser(loggedUser);
        return loggedUser;
    }

    async function login({ email, password }) {
        setError(null);
        try {
            const data = await loginRequest({ email, password });
            applyAuthResponse(data);
            return { success: true };
        } catch (err) {
            const message =
                err.response?.data?.message ||
                'No se pudo iniciar sesión. Verifica tus credenciales.';
            setError(message);
            return { success: false, message };
        }
    }

    async function register({ name, email, password }) {
        setError(null);
        try {
            const data = await registerRequest({ name, email, password });
            applyAuthResponse(data);
            return { success: true };
        } catch (err) {
            const message =
                err.response?.data?.message ||
                'No se pudo completar el registro.';
            setError(message);
            return { success: false, message };
        }
    }

    function logout() {
        clearToken();
        setUser(null);
    }

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
