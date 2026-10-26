import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../hooks/useGoBack';
import { createSupplier, getSupplierById, getSuppliers, updateSupplier } from './supplierApi';
import { getApiErrorMessage } from '../../api/apiError';
import {
    FIELD_LABELS,
    SUPPLIER_FORM_INITIAL_VALUES,
    validateSupplierForm,
} from './supplierValidation';
import '../../components/ui/Catalog.css';
import './SupplierForm.css';

function SupplierFormPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/suppliers');
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [values, setValues] = useState(SUPPLIER_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        getSupplierById(id)
            .then((supplier) => {
                setValues({
                    name: supplier.name || '',
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                });
            })
            .catch(() => {
                setSubmitMessage({
                    type: 'error',
                    text: 'No se pudo cargar el proveedor solicitado.',
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

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSupplierForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => FIELD_LABELS[field] || field)
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
        };

        setIsSubmitting(true);
        try {
            // Un correo repetido viola la restricción única y el backend responde 500 sin mensaje.
            const existing = await getSuppliers();
            const emailTaken = existing.some(
                (supplier) =>
                    String(supplier.supplierId) !== String(id) &&
                    supplier.email?.toLowerCase() === payload.email.toLowerCase()
            );
            if (emailTaken) {
                setErrors({ email: 'Ya existe un proveedor con este correo.' });
                setSubmitMessage({ type: 'error', text: 'Revisa los campos marcados: Correo electrónico.' });
                return;
            }

            await (isEditing ? updateSupplier(id, payload) : createSupplier(payload));
            goBack();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(
                    err,
                    isEditing
                        ? 'No se pudo actualizar el proveedor. Intenta nuevamente.'
                        : 'No se pudo registrar el proveedor. Intenta nuevamente.'
                ),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="catalog-message">Cargando proveedor...</div>;
    }

    return (
        <div className="supplier-form-page">
            <div className="supplier-form-card">
                <h2>{isEditing ? 'Modificar proveedor' : 'Registrar proveedor'}</h2>
                <p className="supplier-form-subtitle">
                    {isEditing
                        ? 'Actualiza los datos de contacto del proveedor.'
                        : 'Registra un proveedor de semillas en la base de datos centralizada.'}
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

                    {submitMessage && (
                        <div className={`supplier-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="supplier-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/suppliers')}
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

export default SupplierFormPage;
