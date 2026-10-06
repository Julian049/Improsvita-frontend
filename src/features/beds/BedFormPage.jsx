import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBed, getBedByCode, getBedById, updateBed } from './bedApi';
import { getApiErrorMessage } from '../../api/apiError';
import { BED_FIELD_LABELS, BED_FORM_INITIAL_VALUES, validateBedForm } from './bedValidation';
import '../../components/ui/Catalog.css';

function BedFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [values, setValues] = useState(BED_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        getBedById(id)
            .then((bed) =>
                setValues({
                    code: bed.code,
                    maxCapacity: bed.maxCapacity > 0 ? String(bed.maxCapacity) : '',
                    active: bed.active,
                })
            )
            .catch(() => setSubmitMessage({ type: 'error', text: 'No se pudo cargar la cama solicitada.' }))
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    function showFieldErrors(fieldErrors) {
        setErrors(fieldErrors);
        const fields = Object.keys(fieldErrors).map((f) => BED_FIELD_LABELS[f]).join(', ');
        setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateBedForm(values);
        if (Object.keys(validationErrors).length > 0) {
            showFieldErrors(validationErrors);
            return;
        }
        setErrors({});

        setIsSubmitting(true);
        try {
            // El código es único en el backend y un duplicado se rechaza con un error de BD poco legible.
            const existing = await getBedByCode(values.code.trim());
            if (existing && String(existing.bedId) !== String(id)) {
                showFieldErrors({ code: 'Ya existe una cama con este código.' });
                return;
            }

            if (isEditing) {
                await updateBed(id, values);
                setSubmitMessage({ type: 'success', text: 'Cama modificada exitosamente.' });
            } else {
                await createBed(values);
                setSubmitMessage({ type: 'success', text: 'Cama registrada exitosamente.' });
                setValues(BED_FORM_INITIAL_VALUES);
            }
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo guardar la cama. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="catalog-message">Cargando cama...</div>;
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>{isEditing ? 'Modificar cama' : 'Registrar cama'}</h2>
                <p className="catalog-form-subtitle">Las camas son los espacios donde se realizan las siembras.</p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <label className="catalog-field">
                        <span>Código *</span>
                        <input
                            type="text"
                            maxLength={30}
                            value={values.code}
                            onChange={handleChange('code')}
                            placeholder="Ej. C-01"
                        />
                        {errors.code && <small className="field-error">{errors.code}</small>}
                    </label>

                    <label className="catalog-field">
                        <span>Capacidad máxima (opcional)</span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={values.maxCapacity}
                            onChange={handleChange('maxCapacity')}
                            placeholder="Ej. 2000"
                        />
                        {errors.maxCapacity ? (
                            <small className="field-error">{errors.maxCapacity}</small>
                        ) : (
                            <small>Cantidad de semillas que caben en la cama.</small>
                        )}
                    </label>

                    {isEditing && (
                        <label className="catalog-checkbox">
                            <input
                                type="checkbox"
                                checked={values.active}
                                onChange={(e) => setValues((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            Cama activa (las camas inactivas no admiten siembras)
                        </label>
                    )}

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                    )}

                    <div className="catalog-form-actions">
                        <button type="button" className="seed-button secondary" onClick={() => navigate('/beds')}>
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

export default BedFormPage;
