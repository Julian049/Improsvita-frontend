export const PLANTING_STATUS = {
    SOWN: 'SOWN',
    GERMINATING: 'GERMINATING',
    GERMINATED: 'GERMINATED',
    FINISHED: 'FINISHED',
};

export const PLANTING_STATUS_FLOW = [
    { value: PLANTING_STATUS.SOWN, label: 'Sembrada' },
    { value: PLANTING_STATUS.GERMINATING, label: 'En germinación' },
    { value: PLANTING_STATUS.GERMINATED, label: 'Germinada' },
    { value: PLANTING_STATUS.FINISHED, label: 'Finalizada' },
];

export const PLANTING_STATUS_LABELS = Object.fromEntries(
    PLANTING_STATUS_FLOW.map((s) => [s.value, s.label])
);

export function getPlantingStatusLabel(status) {
    return PLANTING_STATUS_LABELS[status] || status || '—';
}

export function getStatusIndex(status) {
    return PLANTING_STATUS_FLOW.findIndex((s) => s.value === status);
}

export function getNextStatus(status) {
    const index = getStatusIndex(status);
    if (index === -1 || index >= PLANTING_STATUS_FLOW.length - 1) return null;
    return PLANTING_STATUS_FLOW[index + 1].value;
}

export const PLANTING_LIST_MESSAGES = {
    loadError: 'No se pudo cargar el listado de siembras.',
    statusError: 'No se pudo cambiar el estado de la siembra. Intente nuevamente.',
    activeError: 'No se pudo actualizar la siembra. Intente nuevamente.',
};