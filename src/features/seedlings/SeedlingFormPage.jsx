import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../hooks/useGoBack';
import { getSeedlingById, getSowingOrigins, updateSeedling } from './seedlingApi';
import {
    SEEDLING_FIELD_LABELS,
    SEEDLING_FORM_INITIAL_VALUES,
    SEEDLING_NOTES_MAX,
    SEEDLING_STATUS_OPTIONS,
    validateSeedlingForm,
} from './seedlingValidation';
import { getApiErrorMessage } from '../../api/apiError';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../../components/ui/Catalog.css';

// SUPUESTO: solo edición; el registro de plántulas (desde una siembra completada) depende del backend.
function SeedlingFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const goBack = useGoBack('/seedlings');

    const [values, setValues] = useState(SEEDLING_FORM_INITIAL_VALUES);
    const [origin, setOrigin] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        Promise.all([getSeedlingById(id), getSowingOrigins().catch(() => new Map())])
            .then(([seedling, origins]) => {
                setValues({
                    quantity: String(seedling.quantity),
                    readyDate: seedling.readyDate || '',
                    status: seedling.status,
                    notes: seedling.notes || '',
                });
                setOrigin(origins.get(String(seedling.sowingId)) ?? null);
            })
            .catch(() => setLoadError('No se pudo cargar el registro de plántulas.'))
            .finally(() => setIsLoading(false));
    }, [id]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSeedlingForm(values, { maxQuantity: origin?.quantitySown });
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors).map((f) => SEEDLING_FIELD_LABELS[f] || f).join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateSeedling(id, values);
            goBack();
        } catch (err) {
            setSubmitMessage({ type: 'error', text: getApiErrorMessage(err, 'No se pudieron guardar las plántulas. Intenta nuevamente.') });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="catalog-message">Cargando plántulas...</div>;
    if (loadError) {
        return (
            <div className="catalog-page">
                <div className="catalog-message error">{loadError}</div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>Modificar plántulas</h2>
                <p className="catalog-form-subtitle">
                    {origin
                        ? `${origin.seedName || '—'} · Lote ${origin.lotNumber || '—'} · Cama ${origin.bedCode || '—'} · sembradas ${formatQty(origin.quantitySown)} el ${formatDate(origin.sowingDate)}`
                        : 'Siembra de origen no encontrada.'}
                </p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <label className="catalog-field">
                        <span>Cantidad *</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            className="no-spinner"
                            value={values.quantity}
                            onChange={handleChange('quantity')}
                        />
                        {errors.quantity ? (
                            <small className="field-error">{errors.quantity}</small>
                        ) : (
                            <small>Plántulas disponibles de esta siembra.</small>
                        )}
                    </label>

                    <label className="catalog-field">
                        <span>Estado *</span>
                        <select value={values.status} onChange={handleChange('status')}>
                            {SEEDLING_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.status && <small className="field-error">{errors.status}</small>}
                    </label>

                    <label className="catalog-field">
                        <span>Fecha lista (opcional)</span>
                        <input type="date" value={values.readyDate} onChange={handleChange('readyDate')} />
                    </label>

                    <label className="catalog-field">
                        <span>Notas (opcional)</span>
                        <textarea maxLength={SEEDLING_NOTES_MAX} value={values.notes} onChange={handleChange('notes')} />
                        {errors.notes ? (
                            <small className="field-error">{errors.notes}</small>
                        ) : (
                            <small>{`${values.notes.length}/${SEEDLING_NOTES_MAX}`}</small>
                        )}
                    </label>

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                    )}

                    <div className="catalog-form-actions">
                        <button type="button" className="seed-button secondary" onClick={() => navigate('/seedlings')}>
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SeedlingFormPage;
