export const BED_FIELD_LABELS = {
    code: 'Código',
    maxCapacity: 'Capacidad máxima',
};

// beds.code es NOT NULL, único y de máximo 30 caracteres; max_capacity admite null.
const CODE_MAX = 30;

export function validateBedForm(values) {
    const errors = {};
    const code = values.code.trim();
    const capacity = String(values.maxCapacity ?? '').trim();

    if (!code) errors.code = 'Este campo es obligatorio.';
    else if (code.length > CODE_MAX) errors.code = `Máximo ${CODE_MAX} caracteres.`;

    if (capacity) {
        const number = Number(capacity);
        if (Number.isNaN(number) || number <= 0) {
            errors.maxCapacity = 'La capacidad debe ser un número mayor que cero.';
        }
    }

    return errors;
}

export const BED_FORM_INITIAL_VALUES = {
    code: '',
    maxCapacity: '',
    active: true,
};
