export const CONTACT_FIELD_LABELS = {
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    roles: 'Roles',
};

export const CONTACT_FORM_INITIAL_VALUES = {
    name: '',
    phone: '',
    email: '',
    roles: [],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{7,15}$/;

export function validateContactForm(values) {
    const errors = {};
    const name = values.name.trim();
    const phone = values.phone.trim();
    const email = values.email.trim();

    if (!name) {
        errors.name = 'El nombre es obligatorio.';
    }

    if (!phone) {
        errors.phone = 'El teléfono es obligatorio.';
    } else if (!PHONE_PATTERN.test(phone)) {
        errors.phone = 'Ingresa solo dígitos (entre 7 y 15).';
    }

    if (!email) {
        errors.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!values.roles?.length) {
        errors.roles = 'Selecciona al menos un rol.';
    }

    return errors;
}
