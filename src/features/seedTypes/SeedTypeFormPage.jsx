import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../hooks/useGoBack';
import { createSeedType, getSeedTypeById, updateSeedType } from './seedTypeApi';
import { getApiErrorMessage } from '../../api/apiError';
import {
    SEED_TYPE_FIELD_LABELS,
    SEED_TYPE_FORM_INITIAL_VALUES,
    validateSeedTypeForm,
} from './seedTypeValidation';
import '../../components/ui/Catalog.css';

function SeedTypeFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const goBack = useGoBack('/seed-types');

    const [values, setValues] = useState(SEED_TYPE_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        getSeedTypeById(id)
            .then((seedType) => setValues({ name: seedType.name, description: seedType.description }))
            .catch(() =>
                setSubmitMessage({ type: 'error', text: 'No se pudo cargar el tipo de semilla solicitado.' })
            )
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

        const validationErrors = validateSeedTypeForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors).map((f) => SEED_TYPE_FIELD_LABELS[f]).join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            await (isEditing ? updateSeedType(id, values) : createSeedType(values));
            goBack();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo guardar el tipo de semilla. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="catalog-message">Cargando tipo de semilla...</div>;
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>{isEditing ? 'Modificar tipo de semilla' : 'Registrar tipo de semilla'}</h2>
                <p className="catalog-form-subtitle">
                    Los tipos clasifican las semillas del catálogo (por ejemplo: híbrida, tradicional, orgánica).
                </p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <label className="catalog-field">
                        <span>Nombre *</span>
                        <input
                            type="text"
                            maxLength={50}
                            value={values.name}
                            onChange={handleChange('name')}
                            placeholder="Ej. Orgánica"
                        />
                        {errors.name && <small className="field-error">{errors.name}</small>}
                    </label>

                    <label className="catalog-field">
                        <span>Descripción (opcional)</span>
                        <textarea
                            maxLength={255}
                            value={values.description}
                            onChange={handleChange('description')}
                            placeholder="Características del tipo..."
                        />
                        {errors.description && <small className="field-error">{errors.description}</small>}
                    </label>

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                    )}

                    <div className="catalog-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/seed-types')}
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

export default SeedTypeFormPage;