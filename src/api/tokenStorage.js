const TOKEN_KEY = 'improsvita_token';
const USER_KEY = 'improsvita_user';

export function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    if (isTokenExpired(token)) {
        clearToken();
        return null;
    }

    return token;
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function decodeJwtPayload(token) {
    try {
        const payloadBase64Url = token.split('.')[1];
        const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(payloadBase64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 < Date.now();
}