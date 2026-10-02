const STOP_WORDS = /^(de|del|y|la|los|el)$/i;

export const SUPPLIER_STATUS_FILTERS = {
    all: '',
    active: 'active',
    inactive: 'inactive',
};

export function searchSuppliers(suppliers, searchText) {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return suppliers;

    return suppliers.filter((supplier) => {
        const haystack = [supplier.name, supplier.phone, supplier.email]
            .filter((v) => v !== undefined && v !== null && v !== '')
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
}

export function filterSuppliers(suppliers, status) {
    if (status === SUPPLIER_STATUS_FILTERS.active) return suppliers.filter((s) => s.active);
    if (status === SUPPLIER_STATUS_FILTERS.inactive) return suppliers.filter((s) => !s.active);
    return suppliers;
}

export function sortSuppliers(suppliers) {
    return [...suppliers].sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
}

export function countSuppliersByStatus(suppliers) {
    const active = suppliers.filter((supplier) => supplier.active).length;
    return { all: suppliers.length, active, inactive: suppliers.length - active };
}

export function getSupplierLetter(name) {
    const first = String(name).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0];
    return first && /[a-z]/i.test(first) ? first.toUpperCase() : '#';
}

export function groupSuppliersByLetter(suppliers) {
    const groups = new Map();
    suppliers.forEach((supplier) => {
        const letter = getSupplierLetter(supplier.name);
        if (!groups.has(letter)) groups.set(letter, []);
        groups.get(letter).push(supplier);
    });
    return [...groups.entries()];
}

export function countSeedsBySupplier(seeds) {
    const counts = new Map();
    seeds.forEach((seed) => {
        (seed.supplierIds || []).forEach((id) => {
            const key = String(id);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    });
    return counts;
}

export function getSupplierInitials(name) {
    return String(name)
        .replace(/[^\p{L}\s]/gu, '')
        .split(/\s+/)
        .filter((word) => word && !STOP_WORDS.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}

export function getSupplierHue(name) {
    return ([...String(name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6) * 22 + 80;
}