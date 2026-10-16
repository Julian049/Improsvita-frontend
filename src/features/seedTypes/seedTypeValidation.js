export const SEED_TYPE_FIELD_LABELS = {
    name: 'Nombre',
    description: 'Descripción',
};

const NAME_MAX = 50;
const DESCRIPTION_MAX = 255;

export function validateSeedTypeForm(values) {
    const errors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'Este campo es obligatorio.';
    else if (name.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres.`;

    if (values.description.trim().length > DESCRIPTION_MAX) {
        errors.description = `Máximo ${DESCRIPTION_MAX} caracteres.`;
    }

    return errors;
}

export const SEED_TYPE_FORM_INITIAL_VALUES = {
    name: '',
    description: '',
};