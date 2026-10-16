// Los tipos iniciales se crean con el nombre del enum anterior; aquí se muestran en español.
const LEGACY_LABELS = {
    HYBRID: 'Híbrida',
    TRADITIONAL: 'Tradicional',
    MODIFIED: 'Modificada',
};

export function getSeedTypeLabel(name) {
    if (!name) return '';
    return LEGACY_LABELS[String(name).toUpperCase()] || name;
}