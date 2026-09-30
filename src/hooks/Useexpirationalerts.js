import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllLots } from '../features/lots/lotApi';
import { getAllSeeds } from '../features/seeds/seedApi';
import { ALERT_LEVELS, getExpirationStatus } from '../utils/expirationStatus';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function fetchLotsWithSeedNames() {
    const [lotsData, seedsData] = await Promise.all([getAllLots(), getAllSeeds()]);
    const seedNameById = new Map(seedsData.map((s) => [String(s.seedId), s.name]));
    return lotsData.map((lot) => ({
        ...lot,
        seedName: lot.seedName || seedNameById.get(String(lot.seedId)) || 'Semilla sin nombre',
    }));
}

export function useExpirationAlerts() {
    const [lots, setLots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let isActive = true;

        const sync = () =>
            fetchLotsWithSeedNames()
                .then((data) => {
                    if (!isActive) return;
                    setLots(data);
                    setError(null);
                })
                .catch(() => {
                    if (isActive) setError('No se pudieron cargar las alertas.');
                })
                .finally(() => {
                    if (isActive) setIsLoading(false);
                });

        sync();
        const intervalId = setInterval(sync, REFRESH_INTERVAL_MS);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [refreshKey]);

    const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

    const alerts = useMemo(
        () =>
            lots
                .filter((lot) => Number(lot.availableQuantity) > 0)
                .map((lot) => ({ ...lot, expiration: getExpirationStatus(lot.dueDate) }))
                .filter((lot) => ALERT_LEVELS.includes(lot.expiration.level))
                .sort((a, b) => a.expiration.daysLeft - b.expiration.daysLeft),
        [lots]
    );

    const expiredCount = alerts.filter((lot) => lot.expiration.level === 'expired').length;

    return { alerts, expiredCount, isLoading, error, refresh };
}