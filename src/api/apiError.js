export function getApiErrorMessage(error, fallback) {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    return fallback;
}
