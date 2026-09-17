const PAGE_SIZE = 10;

export function getStockStatus(seed) {
    return Number(seed.quantity) > 0 ? 'available' : 'out_of_stock';
}

export function searchSeeds(seeds, searchText) {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return seeds;

    return seeds.filter((seed) => {
        const haystack = [seed.plantName, seed.variety, seed.supplierName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
}

export function filterSeeds(seeds, filters) {
    return seeds.filter((seed) => {
        if (filters.supplierId && String(seed.supplierId) !== String(filters.supplierId)) {
            return false;
        }

        if (filters.stockStatus && getStockStatus(seed) !== filters.stockStatus) {
            return false;
        }

        if (filters.acquisitionFrom && seed.acquisitionDate < filters.acquisitionFrom) {
            return false;
        }
        if (filters.acquisitionTo && seed.acquisitionDate > filters.acquisitionTo) {
            return false;
        }

        if (filters.expirationFrom && (!seed.expirationDate || seed.expirationDate < filters.expirationFrom)) {
            return false;
        }
        if (filters.expirationTo && (!seed.expirationDate || seed.expirationDate > filters.expirationTo)) {
            return false;
        }

        return true;
    });
}

export function sortSeeds(seeds, sortBy) {
    const sorted = [...seeds];

    switch (sortBy) {
        case 'name_asc':
            return sorted.sort((a, b) => a.plantName.localeCompare(b.plantName));
        case 'name_desc':
            return sorted.sort((a, b) => b.plantName.localeCompare(a.plantName));
        case 'quantity_asc':
            return sorted.sort((a, b) => Number(a.quantity) - Number(b.quantity));
        case 'quantity_desc':
            return sorted.sort((a, b) => Number(b.quantity) - Number(a.quantity));
        case 'acquisition_asc':
            return sorted.sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate));
        case 'acquisition_desc':
        default:
            return sorted.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate));
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
    stockStatus: '',
    acquisitionFrom: '',
    acquisitionTo: '',
    expirationFrom: '',
    expirationTo: '',
};

export const SORT_OPTIONS = [
    { value: 'acquisition_desc', label: 'Fecha de adquisición (recientes primero)' },
    { value: 'acquisition_asc', label: 'Fecha de adquisición (antiguas primero)' },
    { value: 'name_asc', label: 'Nombre (A-Z)' },
    { value: 'name_desc', label: 'Nombre (Z-A)' },
    { value: 'quantity_desc', label: 'Cantidad (mayor a menor)' },
    { value: 'quantity_asc', label: 'Cantidad (menor a mayor)' },
];
