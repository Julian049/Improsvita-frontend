export function toDateOnly(isoDateTimeString) {
    if (!isoDateTimeString) return '';
    return String(isoDateTimeString).slice(0, 10);
}

export function toLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function formatDate(dateString) {
    if (!dateString) return '—';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}