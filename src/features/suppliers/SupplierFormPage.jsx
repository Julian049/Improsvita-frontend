import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupplier, getSuppliers } from './supplierApi';
import {
    CONTACT_FORM_INITIAL_VALUES,
    FIELD_LABELS,
    validateSupplierForm,
} from './supplierValidation';
import './SupplierForm.css';

function SupplierFormPage() {
    const navigate = useNavigate();

    const [values, setValues] = useState(CONTACT_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [existingIdentifications, setExistingIdentifications] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        getSuppliers()
            .then((suppliers) => setExistingIdentifications(suppliers.map((c) => c.identification)))
            .catch(() => setExistingIdentifications([]));
    }, []);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSupplierForm(values, existingIdentifications);
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
            identification: values.identification.trim(),
            name: values.name.trim(),
            phone: values.phone.trim(),
            address: values.address.trim(),
            email: values.email.trim(),
            supplierType: values.supplierType,
        };

        setIsSubmitting(true);
        try {
            await createSupplier(payload);
            setSubmitMessage({ type: 'success', text: 'Contacto registrado exitosamente.' });
            setValues(CONTACT_FORM_INITIAL_VALUES);
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text:
                    err.response?.data?.message ||
                    'No se pudo registrar el contacto. Intenta nuevamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="supplier-form-page">
            <div className="supplier-form-card">
                <h2>Registrar contacto</h2>
                <p className="supplier-form-subtitle">
                    Registra un cliente o proveedor en la base de datos centralizada.
                </p>

                <form onSubmit={handleSubmit} className="supplier-form" noValidate>
                    <div className="supplier-form-row">
                        <label className="supplier-field">
                            <span>Tipo de contacto *</span>
                            <select value={values.supplierType} onChange={handleChange('supplierType')}>
                                <option value="">Selecciona un tipo</option>
                                <option value="Cliente">Cliente</option>
                                <option value="Proveedor">Proveedor</option>
                            </select>
                            {errors.supplierType && (
                                <small className="field-error">{errors.supplierType}</small>
                            )}
                        </label>

                        <label className="supplier-field">
                            <span>Identificación (NIT o C.C.) *</span>
                            <input
                                type="text"
                                value={values.identification}
                                onChange={handleChange('identification')}
                                placeholder="Ej. 900123456-7"
                            />
                            {errors.identification && (
                                <small className="field-error">{errors.identification}</small>
                            )}
                        </label>
                    </div>

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
                            <span>Correo electrónico (opcional)</span>
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

                    <label className="supplier-field">
                        <span>Dirección (opcional)</span>
                        <input
                            type="text"
                            maxLength={150}
                            value={values.address}
                            onChange={handleChange('address')}
                            placeholder="Dirección de contacto"
                        />
                        {errors.address && <small className="field-error">{errors.address}</small>}
                    </label>

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
                            {isSubmitting ? 'Guardando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SupplierFormPage;
