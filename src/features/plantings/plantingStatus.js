export const PLANTING_STATUS = {
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
};

export const PLANTING_STATUS_OPTIONS = [
    { value: PLANTING_STATUS.PLANNED, label: 'Planificada' },
    { value: PLANTING_STATUS.IN_PROGRESS, label: 'En progreso' },
    { value: PLANTING_STATUS.COMPLETED, label: 'Completada' },
    { value: PLANTING_STATUS.FAILED, label: 'Fallida' },
    { value: PLANTING_STATUS.CANCELLED, label: 'Cancelada' },
];

export const PLANTING_STATUS_FLOW = [
    PLANTING_STATUS.PLANNED,
    PLANTING_STATUS.IN_PROGRESS,
    PLANTING_STATUS.COMPLETED,
];

const TERMINAL_STATUSES = [
    PLANTING_STATUS.COMPLETED,
    PLANTING_STATUS.FAILED,
    PLANTING_STATUS.CANCELLED,
];

export const PLANTING_STATUS_LABELS = Object.fromEntries(
    PLANTING_STATUS_OPTIONS.map((s) => [s.value, s.label])
);

export function getPlantingStatusLabel(status) {
    return PLANTING_STATUS_LABELS[status] || status || '—';
}

export function isTerminalStatus(status) {
    return TERMINAL_STATUSES.includes(status);
}

export function getStatusIndex(status) {
    return PLANTING_STATUS_FLOW.indexOf(status);
}

export function getNextStatus(status) {
    const index = getStatusIndex(status);
    if (index === -1 || isTerminalStatus(status)) return null;
    return PLANTING_STATUS_FLOW[index + 1] ?? null;
}

export const PLANTING_LIST_MESSAGES = {
    loadError: 'No se pudo cargar el listado de siembras.',
    statusError: 'No se pudo cambiar el estado de la siembra. Intente nuevamente.',
    germinationError: 'No se pudo registrar la germinación. Intente nuevamente.',
};