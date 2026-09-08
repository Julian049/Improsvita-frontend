import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken as saveToken, clearToken } from '../api/tokenStorage';
import { loginRequest, logoutRequest, getCurrentUserRequest } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = getToken();

        if (!token) {
            setIsLoading(false);
            return;
        }

        getCurrentUserRequest()
            .then((currentUser) => {
                setUser(currentUser);
            })
            .catch(() => {
                // Token inválido o expirado: limpiamos.
                clearToken();
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    async function login({ email, password }) {
        setError(null);
        try {
            const { token, user: loggedUser } = await loginRequest({ email, password });
            saveToken(token);
            setUser(loggedUser);
            return { success: true };
        } catch (err) {
            const message =
                err.response?.data?.message ||
                'No se pudo iniciar sesión. Verifica tus credenciales.';
            setError(message);
            return { success: false, message };
        }
    }

    async function logout() {
        await logoutRequest();
        clearToken();
        setUser(null);
    }

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
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
