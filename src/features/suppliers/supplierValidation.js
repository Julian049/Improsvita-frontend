export const FIELD_LABELS = {
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Correo electrónico',
};

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d+$/;

export function validateSupplierForm(values) {
    const errors = {};

    ['name', 'phone'].forEach((field) => {
        if (isEmpty(values[field])) errors[field] = 'Este campo es obligatorio.';
    });

    if (!isEmpty(values.name) && values.name.length > 100) {
        errors.name = 'Máximo 100 caracteres.';
    }
    if (!isEmpty(values.email) && values.email.length > 100) {
        errors.email = 'Máximo 100 caracteres.';
    }
    if (!isEmpty(values.phone) && !PHONE_REGEX.test(values.phone)) {
        errors.phone = 'El teléfono debe contener solo dígitos.';
    }
    if (!isEmpty(values.email) && !EMAIL_REGEX.test(values.email)) {
        errors.email = 'El formato del correo electrónico no es válido.';
    }

    return errors;
}

export const SUPPLIER_FORM_INITIAL_VALUES = {
    name: '',
    phone: '',
    email: '',
};