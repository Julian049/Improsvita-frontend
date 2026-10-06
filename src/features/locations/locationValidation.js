export const LOCATION_FIELD_LABELS = {
    locationName: 'Nombre',
};

const NAME_MAX = 255;

export function validateLocationForm(values) {
    const errors = {};
    const name = values.locationName.trim();

    if (!name) errors.locationName = 'Este campo es obligatorio.';
    else if (name.length > NAME_MAX) errors.locationName = `Máximo ${NAME_MAX} caracteres.`;

    return errors;
}

export const LOCATION_FORM_INITIAL_VALUES = {
    locationName: '',
    active: true,
};
