import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPlanting } from '../plantingApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getAllLots } from '../../lots/lotApi.js';
import { formatDate } from '../../../utils/dateUtils.js';
import {
    PLANTING_FIELD_LABELS,
    PLANTING_FORM_INITIAL_VALUES,
    PLANTING_LIMITS,
    PLANTING_MESSAGES,
    PLANTING_REQUIRED_FIELDS,
    validatePlantingForm,
} from '../plantingValidation.js';
import { getSeedStockList, getTodayDateString } from '../plantingUtils.js';
import { SEED_TYPE_OPTIONS } from '../../seeds/seedValidation.js';
import './PlantingForm.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

function fetchInventory() {
    return Promise.all([getAllSeeds(), getAllLots()]);
}

function Field({ label, required, error, hint, children }) {
    return (
        <label className="planting-field">
            <span>
                {label}
                {required && ' *'}
            </span>
            {children}
            {hint && !error && <small className="planting-hint">{hint}</small>}
            {error && (
                <small className="planting-field-error" role="alert">
                    {error}
                </small>
            )}
        </label>
    );
}

function PlantingFormPage() {
    const navigate = useNavigate();

    const [values, setValues] = useState(PLANTING_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [seeds, setSeeds] = useState([]);
    const [lots, setLots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        let isActive = true;

        fetchInventory()
            .then(([seedsData, lotsData]) => {
                if (!isActive) return;
                setSeeds(seedsData);
                setLots(lotsData);
            })
            .catch(() => {
                if (isActive) setLoadError('No se pudo cargar el inventario de semillas.');
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const seedOptions = useMemo(() => getSeedStockList(seeds, lots), [seeds, lots]);
    const selectedSeed =
        seedOptions.find((seed) => String(seed.seedId) === String(values.seedId)) ?? null;
    const today = getTodayDateString();
    const isRequired = (field) => PLANTING_REQUIRED_FIELDS.includes(field);

    function handleChange(field) {
        return (e) => {
            const { value } = e.target;
            setValues((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
                ...(field === 'seedId' && { quantity: undefined }),
                ...(field === 'plantingDate' && { harvestDate: undefined }),
            }));
        };
    }

    function refreshInventory() {
        fetchInventory()
            .then(([seedsData, lotsData]) => {
                setSeeds(seedsData);
                setLots([...lotsData]);
            })
            .catch(() => {
            });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validatePlantingForm(values, selectedSeed?.availableStock ?? null);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => PLANTING_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const planting = await createPlanting(values);
            setSubmitMessage({
                type: 'success',
                text: `${PLANTING_MESSAGES.success} Siembra n.° ${planting.plantingId}: se descontaron ${planting.discountedQuantity} semillas del inventario.`,
            });
            setValues(PLANTING_FORM_INITIAL_VALUES);
            refreshInventory();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: err.response?.data?.message || PLANTING_MESSAGES.saveError,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="planting-form-loading">Cargando inventario de semillas...</div>;
    }

    if (loadError) {
        return (
            <div className="planting-form-page">
                <div className="planting-form-message error">{loadError}</div>
            </div>
        );
    }

    return (
        <div className="planting-form-page">
            <div className="planting-form-card">
                <div className="planting-form-header">
                    <button
                        type="button"
                        className="planting-back"
                        onClick={() => navigate('/plantings')}
                        aria-label="Volver a siembras"
                    >
                        ←
                    </button>
                    <h2>Registrar siembra</h2>
                </div>
                <p className="planting-form-subtitle">
                    Siembra semillas del inventario. La cantidad se descuenta automáticamente del stock.
                </p>

                {seedOptions.length === 0 && !submitMessage && (
                    <div className="planting-form-empty">
                        <div className="planting-form-message error">
                            No hay semillas con stock disponible para sembrar.
                        </div>
                        <Link to="/lots/new" className="seed-button primary">
                            Registrar lote
                        </Link>
                    </div>
                )}

                {(seedOptions.length > 0 || submitMessage) && (
                    <form onSubmit={handleSubmit} className="planting-form" noValidate>
                        <Field
                            label="Tipo de semilla"
                            required={isRequired('seedId')}
                            error={errors.seedId}
                        >
                            <select
                                value={values.seedId}
                                onChange={handleChange('seedId')}
                                aria-invalid={Boolean(errors.seedId)}
                            >
                                <option value="">Seleccione el tipo de plántula</option>
                                {seedOptions.map((seed) => (
                                    <option key={seed.seedId} value={seed.seedId}>
                                        {seed.name} — {seed.availableStock} disponibles
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {selectedSeed && (
                            <dl className="planting-stock-info">
                                <div>
                                    <dt>Stock disponible</dt>
                                    <dd>{selectedSeed.availableStock}</dd>
                                </div>
                                <div>
                                    <dt>Tipo</dt>
                                    <dd>{SEED_TYPE_LABELS[selectedSeed.type] || selectedSeed.type || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Proveedor</dt>
                                    <dd>{selectedSeed.supplierNames?.join(', ') || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Próximo vencimiento</dt>
                                    <dd>{formatDate(selectedSeed.nextDueDate)}</dd>
                                </div>
                            </dl>
                        )}

                        <Field
                            label="Cantidad"
                            required={isRequired('quantity')}
                            error={errors.quantity}
                            hint={selectedSeed ? `Máximo ${selectedSeed.availableStock}` : undefined}
                        >
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                step="1"
                                value={values.quantity}
                                onChange={handleChange('quantity')}
                                placeholder="Ej. 500"
                                aria-invalid={Boolean(errors.quantity)}
                            />
                        </Field>

                        <div className="planting-form-row">
                            <Field
                                label="Fecha de siembra"
                                required={isRequired('plantingDate')}
                                error={errors.plantingDate}
                            >
                                <input
                                    type="date"
                                    max={today}
                                    value={values.plantingDate}
                                    onChange={handleChange('plantingDate')}
                                    aria-invalid={Boolean(errors.plantingDate)}
                                />
                            </Field>

                            <Field
                                label="Fecha estimada de cosecha"
                                required={isRequired('harvestDate')}
                                error={errors.harvestDate}
                            >
                                <input
                                    type="date"
                                    min={values.plantingDate || undefined}
                                    value={values.harvestDate}
                                    onChange={handleChange('harvestDate')}
                                    aria-invalid={Boolean(errors.harvestDate)}
                                />
                            </Field>
                        </div>

                        <Field
                            label="Frecuencia de fumigación (días)"
                            required={isRequired('fumigationFrequencyDays')}
                            error={errors.fumigationFrequencyDays}
                        >
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                step="1"
                                value={values.fumigationFrequencyDays}
                                onChange={handleChange('fumigationFrequencyDays')}
                                placeholder="Ej. 15"
                                aria-invalid={Boolean(errors.fumigationFrequencyDays)}
                            />
                        </Field>

                        <Field
                            label="Observaciones"
                            required={isRequired('observations')}
                            error={errors.observations}
                            hint={`${values.observations.length}/${PLANTING_LIMITS.observationsMax}`}
                        >
                            <textarea
                                maxLength={PLANTING_LIMITS.observationsMax}
                                value={values.observations}
                                onChange={handleChange('observations')}
                                aria-invalid={Boolean(errors.observations)}
                            />
                        </Field>

                        {submitMessage && (
                            <div
                                className={`planting-form-message ${submitMessage.type}`}
                                role={submitMessage.type === 'error' ? 'alert' : 'status'}
                            >
                                {submitMessage.text}
                            </div>
                        )}

                        <div className="planting-form-actions">
                            <button
                                type="button"
                                className="seed-button secondary"
                                onClick={() => navigate('/plantings')}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="seed-button primary"
                                disabled={isSubmitting || seedOptions.length === 0}
                            >
                                {isSubmitting ? 'Registrando...' : 'Registrar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default PlantingFormPage;
