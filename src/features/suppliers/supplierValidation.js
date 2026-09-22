export const FIELD_LABELS = {
    identification: 'Identificación',
    name: 'Nombre',
    phone: 'Teléfono',
    supplierType: 'Tipo de contacto',
    email: 'Correo electrónico',
};

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d+$/;

export function validateSupplierForm(values, existingIdentifications = []) {
    const errors = {};

    const requiredFields = ['identification', 'name', 'phone', 'supplierType'];
    requiredFields.forEach((field) => {
        if (isEmpty(values[field])) {
            errors[field] = 'Este campo es obligatorio.';
        }
    });

    if (!isEmpty(values.name) && values.name.length > 100) {
        errors.name = 'Máximo 100 caracteres.';
    }
    if (!isEmpty(values.address) && values.address.length > 150) {
        errors.address = 'Máximo 150 caracteres.';
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

    if (!isEmpty(values.identification)) {
        const normalized = values.identification.trim().toLowerCase();
        const alreadyExists = existingIdentifications.some(
            (id) => String(id).trim().toLowerCase() === normalized
        );
        if (alreadyExists) {
            errors.identification = 'Ya existe un contacto registrado con esta identificación.';
        }
    }

    return errors;
}

export const CONTACT_FORM_INITIAL_VALUES = {
    identification: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    supplierType: '',
};
