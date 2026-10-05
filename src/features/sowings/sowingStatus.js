export const SOWING_STATUS = {
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
};

export const SOWING_STATUS_OPTIONS = [
    { value: SOWING_STATUS.PLANNED, label: 'Planificada' },
    { value: SOWING_STATUS.IN_PROGRESS, label: 'En progreso' },
    { value: SOWING_STATUS.COMPLETED, label: 'Completada' },
    { value: SOWING_STATUS.FAILED, label: 'Fallida' },
    { value: SOWING_STATUS.CANCELLED, label: 'Cancelada' },
];

export const SOWING_STATUS_FLOW = [
    SOWING_STATUS.PLANNED,
    SOWING_STATUS.IN_PROGRESS,
    SOWING_STATUS.COMPLETED,
];

const TERMINAL_STATUSES = [
    SOWING_STATUS.COMPLETED,
    SOWING_STATUS.FAILED,
    SOWING_STATUS.CANCELLED,
];

export const SOWING_STATUS_LABELS = Object.fromEntries(
    SOWING_STATUS_OPTIONS.map((s) => [s.value, s.label])
);

export function getSowingStatusLabel(status) {
    return SOWING_STATUS_LABELS[status] || status || '—';
}

export function isTerminalStatus(status) {
    return TERMINAL_STATUSES.includes(status);
}

export function getStatusIndex(status) {
    return SOWING_STATUS_FLOW.indexOf(status);
}

export function getNextStatus(status) {
    const index = getStatusIndex(status);
    if (index === -1 || isTerminalStatus(status)) return null;
    return SOWING_STATUS_FLOW[index + 1] ?? null;
}

export const SOWING_LIST_MESSAGES = {
    loadError: 'No se pudo cargar el listado de siembras.',
    statusError: 'No se pudo cambiar el estado de la siembra. Intente nuevamente.',
    germinationError: 'No se pudo registrar la germinación. Intente nuevamente.',
};