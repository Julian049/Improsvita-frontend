export const PAGE_SIZE = 10;

export function paginateSeeds(seeds, page) {
    const totalPages = Math.max(1, Math.ceil(seeds.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return {
        pageItems: seeds.slice(start, start + PAGE_SIZE),
        totalPages,
        currentPage: safePage,
    };
}

export const SEED_FILTER_MODES = [
    { value: '', label: 'Sin filtro' },
    { value: 'type', label: 'Tipo' },
    { value: 'supplier', label: 'Proveedor' },
    { value: 'stock', label: 'Stock menor a' },
    { value: 'name', label: 'Nombre exacto' },
];

export const SEED_FILTER_INITIAL_STATE = { mode: '', value: '' };