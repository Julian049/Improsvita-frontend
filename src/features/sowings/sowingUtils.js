import { getExpirationStatus } from '../../utils/expirationStatus';

export function getTodayDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

// Agrupa por semilla los lotes que ya llegan filtrados del backend (status=AVAILABLE).
export function groupLotsBySeed(lots, seeds, today = new Date()) {
    const seedById = new Map(seeds.map((seed) => [String(seed.seedId), seed]));
    const groups = new Map();

    lots.forEach((lot) => {
        const key = String(lot.seedId);
        const seed = seedById.get(key);
        if (!groups.has(key)) {
            groups.set(key, { seedId: key, seedName: seed?.name ?? '—', seedType: seed?.type, lots: [] });
        }
        groups.get(key).lots.push({
            ...lot,
            seedName: seed?.name ?? '—',
            seedType: seed?.type,
            isExpired: getExpirationStatus(lot.dueDate, today).level === 'expired',
        });
    });

    return [...groups.values()];
}
