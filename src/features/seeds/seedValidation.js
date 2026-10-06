export const FIELD_LABELS = {
    name: 'Nombre de la semilla',
    type: 'Tipo',
    description: 'Descripción',
    supplierIds: 'Proveedores',
};

export const SEED_TYPE_OPTIONS = [
    { value: 'HYBRID', label: 'Híbrida' },
    { value: 'TRADITIONAL', label: 'Tradicional' },
    { value: 'MODIFIED', label: 'Modificada' },
];

const NAME_MAX = 50;
const DESCRIPTION_MAX = 255;

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

export function validateSeedForm(values) {
    const errors = {};

    if (isEmpty(values.name)) errors.name = 'Este campo es obligatorio.';
    if (isEmpty(values.type)) errors.type = 'Este campo es obligatorio.';

    if (!isEmpty(values.name) && values.name.length > NAME_MAX) {
        errors.name = `Máximo ${NAME_MAX} caracteres.`;
    }
    if (!isEmpty(values.description) && values.description.length > DESCRIPTION_MAX) {
        errors.description = `Máximo ${DESCRIPTION_MAX} caracteres.`;
    }

    return errors;
}

export const SEED_FORM_INITIAL_VALUES = {
    name: '',
    type: '',
    description: '',
    supplierIds: [],
};