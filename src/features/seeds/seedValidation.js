export const FIELD_LABELS = {
    name: 'Nombre de la semilla',
    type: 'Tipo',
    supplierId: 'Proveedor',
    quantity: 'Cantidad',
    acquisitionDate: 'Fecha de adquisición',
    expirationDate: 'Fecha de vencimiento',
};

export const SEED_TYPE_OPTIONS = [
    { value: 'HYBRID', label: 'Híbrida' },
    { value: 'TRADITIONAL', label: 'Tradicional' },
    { value: 'MODIFIED', label: 'Modificada' },
];

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function toLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function validateSeedForm(values, isEditing) {
    const errors = {};
    const emptyRequiredFields = [];

    const requiredFields = ['name', 'type', 'supplierId', 'quantity', 'acquisitionDate'];
    if (isEditing) requiredFields.push('expirationDate');

    requiredFields.forEach((field) => {
        if (isEmpty(values[field])) {
            emptyRequiredFields.push(FIELD_LABELS[field]);
        }
    });

    if (emptyRequiredFields.length > 0) {
        emptyRequiredFields.forEach((label) => {
            const field = Object.keys(FIELD_LABELS).find((key) => FIELD_LABELS[key] === label);
            errors[field] = `Este campo es obligatorio.`;
        });
    }

    if (!isEmpty(values.name) && values.name.length > 50) {
        errors.name = 'Máximo 50 caracteres.';
    }

    if (!isEmpty(values.quantity)) {
        const quantityNumber = Number(values.quantity);
        if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
            errors.quantity = 'La cantidad ingresada debe ser un número válido y mayor que cero.';
        } else if (String(values.quantity).length > 6) {
            errors.quantity = 'Máximo 6 dígitos.';
        }
    }

    if (!isEmpty(values.acquisitionDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const acquisitionDate = toLocalDate(values.acquisitionDate);

        if (acquisitionDate > today) {
            errors.acquisitionDate = 'La fecha de adquisición no puede ser mayor a la actual.';
        }
    }

    if (!isEmpty(values.expirationDate) && !isEmpty(values.acquisitionDate)) {
        const acquisitionDate = toLocalDate(values.acquisitionDate);
        const expirationDate = toLocalDate(values.expirationDate);

        if (expirationDate < acquisitionDate) {
            errors.expirationDate =
                'La fecha de vencimiento no puede ser menor a la fecha de adquisición.';
        }
    }

    return errors;
}

export const SEED_FORM_INITIAL_VALUES = {
    name: '',
    type: '',
    supplierId: '',
    quantity: '',
    acquisitionDate: '',
    expirationDate: '',
};