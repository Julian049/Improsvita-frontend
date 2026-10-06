import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createLocation, getLocationById, updateLocation } from './locationApi';
import { getApiErrorMessage } from '../../api/apiError';
import {
    LOCATION_FIELD_LABELS,
    LOCATION_FORM_INITIAL_VALUES,
    validateLocationForm,
} from './locationValidation';
import '../../components/ui/Catalog.css';

function LocationFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [values, setValues] = useState(LOCATION_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        getLocationById(id)
            .then((location) =>
                setValues({ locationName: location.locationName, active: location.active })
            )
            .catch(() =>
                setSubmitMessage({ type: 'error', text: 'No se pudo cargar la ubicación solicitada.' })
            )
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateLocationForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors).map((f) => LOCATION_FIELD_LABELS[f]).join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateLocation(id, values);
                setSubmitMessage({ type: 'success', text: 'Ubicación modificada exitosamente.' });
            } else {
                await createLocation(values);
                setSubmitMessage({ type: 'success', text: 'Ubicación registrada exitosamente.' });
                setValues(LOCATION_FORM_INITIAL_VALUES);
            }
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo guardar la ubicación. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="catalog-message">Cargando ubicación...</div>;
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>{isEditing ? 'Modificar ubicación' : 'Registrar ubicación'}</h2>
                <p className="catalog-form-subtitle">
                    Las ubicaciones indican dónde se almacenan los lotes de semillas.
                </p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <label className="catalog-field">
                        <span>Nombre *</span>
                        <input
                            type="text"
                            maxLength={255}
                            value={values.locationName}
                            onChange={(e) => {
                                setValues((prev) => ({ ...prev, locationName: e.target.value }));
                                setErrors({});
                            }}
                            placeholder="Ej. BODEGA-02"
                        />
                        {errors.locationName && <small className="field-error">{errors.locationName}</small>}
                    </label>

                    {isEditing && (
                        <label className="catalog-checkbox">
                            <input
                                type="checkbox"
                                checked={values.active}
                                onChange={(e) => setValues((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            Ubicación activa
                        </label>
                    )}

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                    )}

                    <div className="catalog-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/locations')}
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

export default LocationFormPage;
