import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllSeeds } from '../seeds/seedApi.js';
import { getAllLots } from '../lots/lotApi.js';
import { getAllSowings } from '../sowings/sowingApi.js';
import { getBeds } from '../beds/bedApi.js';
import { getSales } from '../sales/saleApi.js';
import { getReservations } from '../reservations/reservationApi.js';
import { getCommercialData, getDashboardData } from './dashboardUtils.js';

export const DASHBOARD_REFRESH_MS = 60_000;

function toDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchSnapshot() {
    const now = new Date();
    const from = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = toDateKey(now);

    const [seeds, lots, sowings, beds, sales, reservations] = await Promise.all([
        getAllSeeds(),
        getAllLots(),
        getAllSowings(),
        getBeds(),
        getSales({ from, to }),
        getReservations({ status: 'PENDING' }),
    ]);

    return {
        data: getDashboardData({ seeds, lots, sowings, beds }),
        commercial: getCommercialData({ sales, reservations, today: now }),
    };
}

export function useDashboardData() {
    const [data, setData] = useState(null);
    const [commercial, setCommercial] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);
    const hasDataRef = useRef(false);
    const inFlightRef = useRef(false);

    const load = useCallback(async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsRefreshing(true);

        try {
            const snapshot = await fetchSnapshot();
            setData(snapshot.data);
            setCommercial(snapshot.commercial);
            setLastUpdated(new Date());
            setError(null);
            hasDataRef.current = true;
        } catch {
            setError(
                hasDataRef.current
                    ? 'No se pudo actualizar. Se muestran los últimos datos disponibles.'
                    : 'No se pudo cargar el resumen.'
            );
        } finally {
            inFlightRef.current = false;
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timeoutId;

        async function tick() {
            if (cancelled) return;
            if (document.visibilityState === 'visible') {
                await load();
            }
            if (!cancelled && document.visibilityState === 'visible') {
                timeoutId = setTimeout(tick, DASHBOARD_REFRESH_MS);
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                clearTimeout(timeoutId);
                tick();
            } else {
                clearTimeout(timeoutId);
            }
        }

        tick();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [load]);

    return {
        data,
        commercial,
        isRefreshing,
        lastUpdated,
        error,
        refresh: load,
    };
}
