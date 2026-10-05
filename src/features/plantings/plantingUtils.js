import { getExpirationStatus } from '../../utils/expirationStatus';

export function getTodayDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function getSowableLotGroups(lots, seeds, today = new Date()) {
    const seedById = new Map(seeds.map((seed) => [String(seed.seedId), seed]));
    const groups = new Map();

    lots.forEach((lot) => {
        if (!(Number(lot.availableQuantity) > 0)) return;
        if (getExpirationStatus(lot.dueDate, today).level === 'expired') return;

        const seed = seedById.get(String(lot.seedId));
        if (!seed || !seed.active) return;

        const key = String(seed.seedId);
        if (!groups.has(key)) groups.set(key, { seed, lots: [] });
        groups.get(key).lots.push({ ...lot, seedName: seed.name, seedType: seed.type });
    });

    return [...groups.values()]
        .map((group) => ({
            ...group,
            lots: group.lots.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')),
        }))
        .sort((a, b) => a.seed.name.localeCompare(b.seed.name, 'es'));
}