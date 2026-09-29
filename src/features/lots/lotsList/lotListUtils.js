const PAGE_SIZE = 10;

export function getStockStatus(lot) {
    return Number(lot.availableQuantity) > 0 ? 'available' : 'out_of_stock';
}

export function searchLots(lots, searchText) {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return lots;

    return lots.filter((lot) => {
        const haystack = [lot.seedName, lot.locationName, lot.lotNumber]
            .filter((v) => v !== undefined && v !== null && v !== '')
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
}

export function filterLots(lots, filters) {
    return lots.filter((lot) => {
        if (filters.seedId && String(lot.seedId) !== String(filters.seedId)) return false;
        if (filters.locationId && String(lot.locationId) !== String(filters.locationId)) return false;
        if (filters.status && lot.status !== filters.status) return false;
        if (filters.stockStatus && getStockStatus(lot) !== filters.stockStatus) return false;

        if (filters.entryFrom && lot.entryDate < filters.entryFrom) return false;
        if (filters.entryTo && lot.entryDate > filters.entryTo) return false;

        if (filters.dueFrom && (!lot.dueDate || lot.dueDate < filters.dueFrom)) return false;
        if (filters.dueTo && (!lot.dueDate || lot.dueDate > filters.dueTo)) return false;

        return true;
    });
}

export function sortLots(lots, sortBy) {
    const sorted = [...lots];

    switch (sortBy) {
        case 'entry_asc':
            return sorted.sort((a, b) => a.entryDate.localeCompare(b.entryDate));
        case 'due_asc':
            return sorted.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
        case 'due_desc':
            return sorted.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
        case 'quantity_asc':
            return sorted.sort((a, b) => Number(a.availableQuantity) - Number(b.availableQuantity));
        case 'quantity_desc':
            return sorted.sort((a, b) => Number(b.availableQuantity) - Number(a.availableQuantity));
        case 'entry_desc':
        default:
            return sorted.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    }
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

export const LOT_FILTERS_INITIAL_STATE = {
    seedId: '',
    locationId: '',
    status: '',
    stockStatus: '',
    entryFrom: '',
    entryTo: '',
    dueFrom: '',
    dueTo: '',
};

export const SORT_OPTIONS = [
    { value: 'entry_desc', label: 'Fecha de ingreso (recientes primero)' },
    { value: 'entry_asc', label: 'Fecha de ingreso (antiguas primero)' },
    { value: 'due_asc', label: 'Vencimiento (más próximo primero)' },
    { value: 'due_desc', label: 'Vencimiento (más lejano primero)' },
    { value: 'quantity_desc', label: 'Disponible (mayor a menor)' },
    { value: 'quantity_asc', label: 'Disponible (menor a mayor)' },
];