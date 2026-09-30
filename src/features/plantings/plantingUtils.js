import { getExpirationStatus } from '../../utils/expirationStatus';

export function getTodayDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function getSeedStockList(seeds, lots, today = new Date()) {
    const stockBySeed = new Map();

    lots.forEach((lot) => {
        const quantity = Number(lot.availableQuantity);
        if (!(quantity > 0)) return;
        if (getExpirationStatus(lot.dueDate, today).level === 'expired') return;

        const key = String(lot.seedId);
        const current = stockBySeed.get(key) ?? { total: 0, nextDueDate: null };
        current.total += quantity;
        if (lot.dueDate && (!current.nextDueDate || lot.dueDate < current.nextDueDate)) {
            current.nextDueDate = lot.dueDate;
        }
        stockBySeed.set(key, current);
    });

    return seeds
        .filter((seed) => seed.active)
        .map((seed) => {
            const stock = stockBySeed.get(String(seed.seedId));
            return {
                ...seed,
                availableStock: stock?.total ?? 0,
                nextDueDate: stock?.nextDueDate ?? null,
            };
        })
        .filter((seed) => seed.availableStock > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
}