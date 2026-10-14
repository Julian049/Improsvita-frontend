// SUPUESTO: estados y reglas de plántulas definidos en el frontend; el backend aún no existe.
export const SEEDLING_STATUS_OPTIONS = [
    { value: 'GROWING', label: 'En desarrollo' },
    { value: 'READY', label: 'Lista para entrega' },
    { value: 'DISCARDED', label: 'Descartada' },
];

const SEEDLING_STATUS_LABELS = Object.fromEntries(SEEDLING_STATUS_OPTIONS.map((o) => [o.value, o.label]));

export function getSeedlingStatusLabel(status) {
    return SEEDLING_STATUS_LABELS[status] || status || '—';
}

export const SEEDLING_FIELD_LABELS = {
    quantity: 'Cantidad',
    readyDate: 'Fecha lista',
    status: 'Estado',
    notes: 'Notas',
};

export const SEEDLING_NOTES_MAX = 300;

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

// SUPUESTO: no puede haber más plántulas que semillas sembradas en su siembra de origen.
export function validateSeedlingForm(values, { maxQuantity } = {}) {
    const errors = {};

    if (isEmpty(values.quantity)) {
        errors.quantity = 'Este campo es obligatorio.';
    } else {
        const quantity = Number(values.quantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            errors.quantity = 'La cantidad debe ser un número entero de 0 o más.';
        } else if (maxQuantity != null && quantity > maxQuantity) {
            errors.quantity = `No puede superar lo sembrado (${maxQuantity}).`;
        }
    }

    if (!SEEDLING_STATUS_LABELS[values.status]) errors.status = 'Selecciona un estado.';
    if ((values.notes ?? '').length > SEEDLING_NOTES_MAX) errors.notes = `Máximo ${SEEDLING_NOTES_MAX} caracteres.`;

    return errors;
}

export const SEEDLING_FORM_INITIAL_VALUES = {
    quantity: '',
    readyDate: '',
    status: 'GROWING',
    notes: '',
};
