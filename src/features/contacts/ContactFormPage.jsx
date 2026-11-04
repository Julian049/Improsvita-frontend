import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createContact, getContactById, getContacts, updateContact } from './contactApi';
import { CONTACT_ROLE_OPTIONS } from './contactRoles';
import {
    CONTACT_FIELD_LABELS,
    CONTACT_FORM_INITIAL_VALUES,
    validateContactForm,
} from './contactValidation';
import { getApiErrorMessage } from '../../api/apiError';
import '../../components/ui/Catalog.css';
import '../suppliers/SupplierForm.css';
import './Contact.css';

function ContactFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [values, setValues] = useState(CONTACT_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        getContactById(id)
            .then((contact) => {
                setValues({
                    name: contact.name || '',
                    phone: contact.phone || '',
                    email: contact.email || '',
                    roles: contact.roles || [],
                });
            })
            .catch(() => {
                setSubmitMessage({
                    type: 'error',
                    text: 'No se pudo cargar el contacto solicitado.',
                });
            })
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    function handleRoleToggle(role) {
        setValues((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((item) => item !== role)
                : [...prev.roles, role],
        }));
        setErrors((prev) => ({ ...prev, roles: undefined }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateContactForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => CONTACT_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        const payload = {
            name: values.name.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            roles: values.roles,
        };

        setIsSubmitting(true);
        try {
            const existing = await getContacts(null, true);
            const emailTaken = existing.some(
                (contact) =>
                    String(contact.id) !== String(id) &&
                    contact.email?.toLowerCase() === payload.email.toLowerCase()
            );
            if (emailTaken) {
                setErrors({ email: 'Ya existe un contacto con este correo.' });
                setSubmitMessage({ type: 'error', text: 'Revisa los campos marcados: Correo electrónico.' });
                return;
            }

            await (isEditing ? updateContact(id, payload) : createContact(payload));
            navigate('/contacts');
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(
                    err,
                    isEditing
                        ? 'No se pudo actualizar el contacto. Intenta nuevamente.'
                        : 'No se pudo registrar el contacto. Intenta nuevamente.'
                ),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="catalog-message">Cargando contacto...</div>;
    }

    return (
        <div className="supplier-form-page">
            <div className="supplier-form-card">
                <h2>{isEditing ? 'Modificar contacto' : 'Registrar contacto'}</h2>
                <p className="supplier-form-subtitle">
                    {isEditing
                        ? 'Actualiza los datos y roles del contacto.'
                        : 'Registra un contacto y asígnale uno o varios roles.'}
                </p>

                <form onSubmit={handleSubmit} className="supplier-form" noValidate>
                    <label className="supplier-field">
                        <span>Nombre *</span>
                        <input
                            type="text"
                            maxLength={100}
                            value={values.name}
                            onChange={handleChange('name')}
                            placeholder="Nombre o razón social"
                        />
                        {errors.name && <small className="field-error">{errors.name}</small>}
                    </label>

                    <div className="supplier-form-row">
                        <label className="supplier-field">
                            <span>Teléfono *</span>
                            <input
                                type="tel"
                                maxLength={15}
                                value={values.phone}
                                onChange={handleChange('phone')}
                                placeholder="Solo dígitos"
                            />
                            {errors.phone && <small className="field-error">{errors.phone}</small>}
                        </label>

                        <label className="supplier-field">
                            <span>Correo electrónico *</span>
                            <input
                                type="email"
                                maxLength={100}
                                value={values.email}
                                onChange={handleChange('email')}
                                placeholder="nombre@correo.com"
                            />
                            {errors.email && <small className="field-error">{errors.email}</small>}
                        </label>
                    </div>

                    <fieldset className="contact-role-fieldset">
                        <legend>Roles *</legend>
                        <div className="contact-role-options">
                            {CONTACT_ROLE_OPTIONS.map((role) => (
                                <label key={role.value} className="contact-role-option">
                                    <input
                                        type="checkbox"
                                        checked={values.roles.includes(role.value)}
                                        onChange={() => handleRoleToggle(role.value)}
                                    />
                                    <span>
                                        <strong>{role.label}</strong>
                                        <span>{role.hint}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.roles && <small className="field-error">{errors.roles}</small>}
                    </fieldset>

                    {submitMessage && (
                        <div className={`supplier-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="supplier-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/contacts')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ContactFormPage;
