const PAGE_SIZE = 10;

export function searchSeeds(seeds, searchText) {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return seeds;

    return seeds.filter((seed) => {
        const haystack = [seed.name, seed.type, seed.description, seed.supplierNames.join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
}

export function filterSeeds(seeds, filters) {
    return seeds.filter((seed) => {
        if (filters.supplierId && !seed.supplierIds.map(String).includes(String(filters.supplierId))) {
            return false;
        }
        if (filters.type && seed.type !== filters.type) return false;
        if (filters.active !== '' && String(seed.active) !== filters.active) return false;
        return true;
    });
}

export function sortSeeds(seeds, sortBy) {
    const sorted = [...seeds];

    switch (sortBy) {
        case 'name_desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'created_asc':
            return sorted.sort((a, b) => a.createdDate.localeCompare(b.createdDate));
        case 'created_desc':
            return sorted.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
        case 'name_asc':
        default:
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
}

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

export const SEED_FILTERS_INITIAL_STATE = {
    supplierId: '',
    type: '',
    active: '',
};

export const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Nombre (A-Z)' },
    { value: 'name_desc', label: 'Nombre (Z-A)' },
    { value: 'created_desc', label: 'Fecha de creación (recientes primero)' },
    { value: 'created_asc', label: 'Fecha de creación (antiguas primero)' },
];