import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPlanting } from '../plantingApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getAllLots } from '../../lots/lotApi.js';
import { getBeds } from '../../beds/bedApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import { formatDate } from '../../../utils/dateUtils.js';
import { formatQty } from '../../../utils/numberUtils.js';
import {
    PLANTING_FIELD_LABELS,
    PLANTING_FORM_INITIAL_VALUES,
    PLANTING_LIMITS,
    PLANTING_MESSAGES,
    PLANTING_REQUIRED_FIELDS,
    validatePlantingForm,
} from '../plantingValidation.js';
import { getSowableLotGroups, getTodayDateString } from '../plantingUtils.js';
import { SEED_TYPE_OPTIONS } from '../../seeds/seedValidation.js';
import './PlantingForm.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

function fetchInventory() {
    return Promise.all([getAllSeeds(), getAllLots(), getBeds()]);
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
    const [beds, setBeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        let isActive = true;

        fetchInventory()
            .then(([seedsData, lotsData, bedsData]) => {
                if (!isActive) return;
                setSeeds(seedsData);
                setLots(lotsData);
                setBeds(bedsData);
            })
            .catch(() => {
                if (isActive) setLoadError('No se pudo cargar el inventario de lotes y camas.');
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const lotGroups = useMemo(() => getSowableLotGroups(lots, seeds), [lots, seeds]);
    const activeBeds = useMemo(() => beds.filter((bed) => bed.active), [beds]);

    const selectedLot =
        lotGroups
            .flatMap((group) => group.lots)
            .find((lot) => String(lot.lotId) === String(values.lotId)) ?? null;
    const availableStock = selectedLot ? Number(selectedLot.availableQuantity) : null;

    const today = getTodayDateString();
    const isRequired = (field) => PLANTING_REQUIRED_FIELDS.includes(field);
    const canSubmit = lotGroups.length > 0 && activeBeds.length > 0;

    function handleChange(field) {
        return (e) => {
            const { value } = e.target;
            setValues((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
                ...(field === 'lotId' && { quantity: undefined }),
                ...(field === 'sowingDate' && { expectedGerminationDate: undefined }),
            }));
        };
    }

    function refreshLots() {
        getAllLots()
            .then(setLots)
            .catch(() => {});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validatePlantingForm(values, availableStock);
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
                text: `${PLANTING_MESSAGES.success} Siembra n.° ${planting.plantingId}: se descontaron ${formatQty(planting.quantitySown)} semillas del lote ${selectedLot.lotNumber}.`,
            });
            setValues(PLANTING_FORM_INITIAL_VALUES);
            refreshLots();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, PLANTING_MESSAGES.saveError),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="planting-form-loading">Cargando inventario de lotes y camas...</div>;
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
                    Siembra semillas de un lote en una cama. La cantidad se descuenta automáticamente del lote.
                </p>

                {lotGroups.length === 0 && !submitMessage && (
                    <div className="planting-form-empty">
                        <div className="planting-form-message error">
                            No hay lotes con stock disponible para sembrar.
                        </div>
                        <Link to="/lots/new" className="seed-button primary">
                            Registrar lote
                        </Link>
                    </div>
                )}

                {lotGroups.length > 0 && activeBeds.length === 0 && (
                    <div className="planting-form-message error">
                        No hay camas activas registradas. Registra una cama para poder sembrar.
                    </div>
                )}

                {(canSubmit || submitMessage) && (
                    <form onSubmit={handleSubmit} className="planting-form" noValidate>
                        <Field label="Lote" required={isRequired('lotId')} error={errors.lotId}>
                            <select
                                value={values.lotId}
                                onChange={handleChange('lotId')}
                                aria-invalid={Boolean(errors.lotId)}
                            >
                                <option value="">Seleccione el lote a sembrar</option>
                                {lotGroups.map((group) => (
                                    <optgroup key={group.seed.seedId} label={group.seed.name}>
                                        {group.lots.map((lot) => (
                                            <option key={lot.lotId} value={lot.lotId}>
                                                Lote {lot.lotNumber} — {formatQty(lot.availableQuantity)} disponibles
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </Field>

                        {selectedLot && (
                            <dl className="planting-stock-info">
                                <div>
                                    <dt>Semilla</dt>
                                    <dd>{selectedLot.seedName}</dd>
                                </div>
                                <div>
                                    <dt>Tipo</dt>
                                    <dd>{SEED_TYPE_LABELS[selectedLot.seedType] || selectedLot.seedType || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Stock del lote</dt>
                                    <dd>{formatQty(selectedLot.availableQuantity)}</dd>
                                </div>
                                <div>
                                    <dt>Vencimiento</dt>
                                    <dd>{formatDate(selectedLot.dueDate)}</dd>
                                </div>
                            </dl>
                        )}

                        <div className="planting-form-row">
                            <Field label="Cama" required={isRequired('bedId')} error={errors.bedId}>
                                <select
                                    value={values.bedId}
                                    onChange={handleChange('bedId')}
                                    aria-invalid={Boolean(errors.bedId)}
                                >
                                    <option value="">Seleccione la cama</option>
                                    {activeBeds.map((bed) => (
                                        <option key={bed.bedId} value={bed.bedId}>
                                            {bed.code} — capacidad {formatQty(bed.maxCapacity)}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Cantidad"
                                required={isRequired('quantity')}
                                error={errors.quantity}
                                hint={selectedLot ? `Máximo ${formatQty(availableStock)}` : undefined}
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
                        </div>

                        <div className="planting-form-row">
                            <Field
                                label="Fecha de siembra"
                                required={isRequired('sowingDate')}
                                error={errors.sowingDate}
                            >
                                <input
                                    type="date"
                                    max={today}
                                    value={values.sowingDate}
                                    onChange={handleChange('sowingDate')}
                                    aria-invalid={Boolean(errors.sowingDate)}
                                />
                            </Field>

                            <Field
                                label="Germinación esperada"
                                required={isRequired('expectedGerminationDate')}
                                error={errors.expectedGerminationDate}
                            >
                                <input
                                    type="date"
                                    min={values.sowingDate || undefined}
                                    value={values.expectedGerminationDate}
                                    onChange={handleChange('expectedGerminationDate')}
                                    aria-invalid={Boolean(errors.expectedGerminationDate)}
                                />
                            </Field>
                        </div>

                        <Field
                            label="Notas"
                            required={isRequired('notes')}
                            error={errors.notes}
                            hint={`${values.notes.length}/${PLANTING_LIMITS.notesMax}`}
                        >
                            <textarea
                                maxLength={PLANTING_LIMITS.notesMax}
                                value={values.notes}
                                onChange={handleChange('notes')}
                                aria-invalid={Boolean(errors.notes)}
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
                                disabled={isSubmitting || !canSubmit}
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
