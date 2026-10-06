const PAGE_SIZE = 10;

export function getStockStatus(lot) {
    return Number(lot.availableQuantity) > 0 ? 'available' : 'out_of_stock';
}

export function paginateLots(lots, page) {
    const totalPages = Math.max(1, Math.ceil(lots.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return {
        pageItems: lots.slice(start, start + PAGE_SIZE),
        totalPages,
        currentPage: safePage,
    };
}

export const LOT_FILTER_MODES = [
    { value: '', label: 'Sin filtro' },
    { value: 'seedId', label: 'Semilla' },
    { value: 'locationId', label: 'Ubicación' },
    { value: 'status', label: 'Estado' },
];

export const LOT_FILTER_INITIAL_STATE = { mode: '', value: '' };
