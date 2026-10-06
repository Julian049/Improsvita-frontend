const STOP_WORDS = /^(de|del|y|la|los|el)$/i;

export function sortSuppliers(suppliers) {
    return [...suppliers].sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
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