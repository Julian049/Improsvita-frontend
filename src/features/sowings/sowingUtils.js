import { getExpirationStatus } from '../../utils/expirationStatus';
import { isTerminalStatus } from './sowingStatus';

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

// Ocupan la cama las siembras que siguen abiertas (planificadas o en progreso).
// El backend no controla la capacidad de la cama: este cálculo es la única validación.
export function getBedUsage(bed, sowings) {
    const used = sowings
        .filter((sowing) => String(sowing.bedId) === String(bed.bedId) && !isTerminalStatus(sowing.status))
        .reduce((total, sowing) => total + (Number(sowing.quantitySown) || 0), 0);

    const hasCapacity = bed.maxCapacity > 0;
    return {
        used,
        // null = la cama no tiene capacidad máxima definida, así que no hay límite.
        free: hasCapacity ? Math.max(bed.maxCapacity - used, 0) : null,
        percent: hasCapacity ? Math.min(100, (used / bed.maxCapacity) * 100) : 0,
    };
}
