import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createLot, getLotById, updateLot } from '../lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import {
    LOT_FIELD_LABELS,
    LOT_FORM_INITIAL_VALUES,
    getLotStatusLabel,
    validateLotForm,
} from '../lotValidation.js';
import './LotForm.css';

function LotFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [values, setValues] = useState(LOT_FORM_INITIAL_VALUES);
    const [readOnlyInfo, setReadOnlyInfo] = useState(null);
    const [errors, setErrors] = useState({});
    const [seeds, setSeeds] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        getAllSeeds().then(setSeeds).catch(() => setSeeds([]));
        getLocations().then(setLocations).catch(() => setLocations([]));
    }, []);

    useEffect(() => {
        if (!isEditing) return;

        getLotById(id)
            .then((lot) => {
                setValues({
                    seedId: lot.seedId ? String(lot.seedId) : '',
                    locationId: lot.locationId ? String(lot.locationId) : '',
                    lotNumber: lot.lotNumber != null ? String(lot.lotNumber) : '',
                    entryDate: lot.entryDate || '',
                    dueDate: lot.dueDate || '',
                    initialQuantity: lot.initialQuantity != null ? String(lot.initialQuantity) : '',
                });
                setReadOnlyInfo({
                    availableQuantity: lot.availableQuantity,
                    status: lot.status,
                });
            })
            .catch(() => {
                setSubmitMessage({
                    type: 'error',
                    text: 'No se pudo cargar el lote solicitado.',
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

        const validationErrors = validateLotForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => LOT_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateLot(id, values);
                setSubmitMessage({ type: 'success', text: 'Lote modificado exitosamente.' });
            } else {
                await createLot(values);
                setSubmitMessage({ type: 'success', text: 'Lote registrado exitosamente.' });
                setValues(LOT_FORM_INITIAL_VALUES);
            }
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text:
                    err.response?.data?.message ||
                    'No se pudo guardar el lote. Intenta nuevamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="lot-form-loading">Cargando información del lote...</div>;
    }

    const seedOptions = seeds.filter((s) => s.active || String(s.seedId) === values.seedId);
    const locationOptions = locations.filter(
        (l) => l.active || String(l.locationId) === values.locationId
    );

    return (
        <div className="lot-form-page">
            <div className="lot-form-card">
                <h2>{isEditing ? 'Modificar lote' : 'Registrar lote'}</h2>
                <p className="lot-form-subtitle">
                    {isEditing
                        ? 'Actualiza la información de este lote de semillas.'
                        : 'Registra un lote de una semilla del catálogo.'}
                </p>

                <form onSubmit={handleSubmit} className="lot-form" noValidate>
                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>Semilla *</span>
                            <select value={values.seedId} onChange={handleChange('seedId')}>
                                <option value="">Selecciona una semilla</option>
                                {seedOptions.map((seed) => (
                                    <option key={seed.seedId} value={seed.seedId}>
                                        {seed.name}
                                    </option>
                                ))}
                            </select>
                            {errors.seedId && <small className="field-error">{errors.seedId}</small>}
                        </label>

                        <label className="lot-field">
                            <span>Ubicación *</span>
                            <select value={values.locationId} onChange={handleChange('locationId')}>
                                <option value="">Selecciona una ubicación</option>
                                {locationOptions.map((location) => (
                                    <option key={location.locationId} value={location.locationId}>
                                        {location.locationName}
                                    </option>
                                ))}
                            </select>
                            {errors.locationId && (
                                <small className="field-error">{errors.locationId}</small>
                            )}
                        </label>
                    </div>

                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>Número de lote *</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={values.lotNumber}
                                onChange={handleChange('lotNumber')}
                                placeholder="Ej. 101"
                            />
                            {errors.lotNumber && (
                                <small className="field-error">{errors.lotNumber}</small>
                            )}
                        </label>

                        <label className="lot-field">
                            <span>Cantidad inicial *</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={values.initialQuantity}
                                onChange={handleChange('initialQuantity')}
                                placeholder="Ej. 100"
                            />
                            {errors.initialQuantity && (
                                <small className="field-error">{errors.initialQuantity}</small>
                            )}
                        </label>
                    </div>

                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>Fecha de ingreso *</span>
                            <input
                                type="date"
                                value={values.entryDate}
                                onChange={handleChange('entryDate')}
                            />
                            {errors.entryDate && (
                                <small className="field-error">{errors.entryDate}</small>
                            )}
                        </label>

                        <label className="lot-field">
                            <span>Fecha de vencimiento *</span>
                            <input
                                type="date"
                                value={values.dueDate}
                                onChange={handleChange('dueDate')}
                            />
                            {errors.dueDate && <small className="field-error">{errors.dueDate}</small>}
                        </label>
                    </div>

                    {isEditing && readOnlyInfo && (
                        <div className="lot-form-row">
                            <div className="lot-field">
                                <span>Cantidad disponible</span>
                                <div className="lot-field-readonly">{readOnlyInfo.availableQuantity}</div>
                            </div>
                            <div className="lot-field">
                                <span>Estado</span>
                                <div className="lot-field-readonly">
                                    {getLotStatusLabel(readOnlyInfo.status)}
                                </div>
                            </div>
                        </div>
                    )}

                    {submitMessage && (
                        <div className={`lot-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="lot-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/lots')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Guardando...'
                                : isEditing
                                    ? 'Guardar cambios'
                                    : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LotFormPage;
