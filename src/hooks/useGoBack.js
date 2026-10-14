import { useLocation, useNavigate } from 'react-router-dom';

// Vuelve a la pantalla anterior; si se entró directo por URL (key 'default') no hay historial propio y se va a fallback.
export function useGoBack(fallback) {
    const navigate = useNavigate();
    const location = useLocation();
    return () => (location.key === 'default' ? navigate(fallback) : navigate(-1));
}
