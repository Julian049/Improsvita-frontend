import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSowing } from '../sowingApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getLots } from '../../lots/lotApi.js';
import { getBeds } from '../../beds/bedApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import { formatDate } from '../../../utils/dateUtils.js';
import { formatQty } from '../../../utils/numberUtils.js';
import {
    SOWING_FIELD_LABELS,
    SOWING_FORM_INITIAL_VALUES,
    SOWING_LIMITS,
    SOWING_MESSAGES,
    SOWING_REQUIRED_FIELDS,
    validateSowingForm,
} from '../sowingValidation.js';
import { getTodayDateString, groupLotsBySeed } from '../sowingUtils.js';
import { SEED_TYPE_OPTIONS } from '../../seeds/seedValidation.js';
import './SowingForm.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const fetchAvailableLots = () => getLots({ mode: 'status', value: 'AVAILABLE' });

function fetchInventory() {
    return Promise.all([getAllSeeds(), fetchAvailableLots(), getBeds()]);
}

function Field({ label, required, error, hint, children }) {
    return (
        <label className="sowing-field">
            <span>
                {label}
                {required && ' *'}
            </span>
            {children}
            {hint && !error && <small className="sowing-hint">{hint}</small>}
            {error && (
                <small className="sowing-field-error" role="alert">
                    {error}
                </small>
            )}
        </label>
    );
}

function SowingFormPage() {
    const navigate = useNavigate();

    const [values, setValues] = useState(SOWING_FORM_INITIAL_VALUES);
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

    const lotGroups = useMemo(() => groupLotsBySeed(lots, seeds), [lots, seeds]);
    const hasActiveBed = beds.some((bed) => bed.active);

    const selectedLot =
        lotGroups
            .flatMap((group) => group.lots)
            .find((lot) => String(lot.lotId) === String(values.lotId)) ?? null;
    const availableStock = selectedLot ? Number(selectedLot.availableQuantity) : null;

    const today = getTodayDateString();
    const isRequired = (field) => SOWING_REQUIRED_FIELDS.includes(field);
    const canSubmit = lotGroups.length > 0 && hasActiveBed;

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
        fetchAvailableLots()
            .then(setLots)
            .catch(() => {});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSowingForm(values, availableStock);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => SOWING_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const sowing = await createSowing(values);
            setSubmitMessage({
                type: 'success',
                text: `${SOWING_MESSAGES.success} Siembra n.° ${sowing.sowingId}: se descontaron ${formatQty(sowing.quantitySown)} semillas del lote ${selectedLot.lotNumber}.`,
            });
            setValues(SOWING_FORM_INITIAL_VALUES);
            refreshLots();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, SOWING_MESSAGES.saveError),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="sowing-form-loading">Cargando inventario de lotes y camas...</div>;
    }

    if (loadError) {
        return (
            <div className="sowing-form-page">
                <div className="sowing-form-message error">{loadError}</div>
            </div>
        );
    }

    return (
        <div className="sowing-form-page">
            <div className="sowing-form-card">
                <div className="sowing-form-header">
                    <button
                        type="button"
                        className="sowing-back"
                        onClick={() => navigate('/sowings')}
                        aria-label="Volver a siembras"
                    >
                        ←
                    </button>
                    <h2>Registrar siembra</h2>
                </div>
                <p className="sowing-form-subtitle">
                    Siembra semillas de un lote en una cama. La cantidad se descuenta automáticamente del lote.
                </p>

                {lotGroups.length === 0 && !submitMessage && (
                    <div className="sowing-form-empty">
                        <div className="sowing-form-message error">
                            No hay lotes con stock disponible para sembrar.
                        </div>
                        <Link to="/lots/new" className="seed-button primary">
                            Registrar lote
                        </Link>
                    </div>
                )}

                {lotGroups.length > 0 && !hasActiveBed && (
                    <div className="sowing-form-message error">
                        No hay camas activas registradas. Registra una cama para poder sembrar.
                    </div>
                )}

                {(canSubmit || submitMessage) && (
                    <form onSubmit={handleSubmit} className="sowing-form" noValidate>
                        <Field label="Lote" required={isRequired('lotId')} error={errors.lotId}>
                            <select
                                value={values.lotId}
                                onChange={handleChange('lotId')}
                                aria-invalid={Boolean(errors.lotId)}
                            >
                                <option value="">Seleccione el lote a sembrar</option>
                                {lotGroups.map((group) => (
                                    <optgroup key={group.seedId} label={group.seedName}>
                                        {group.lots.map((lot) => (
                                            <option key={lot.lotId} value={lot.lotId}>
                                                Lote {lot.lotNumber} — {formatQty(lot.availableQuantity)} disponibles
                                                {lot.isExpired ? ' · vencido' : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </Field>

                        {selectedLot && (
                            <dl className="sowing-stock-info">
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

                        <div className="sowing-form-row">
                            <Field label="Cama" required={isRequired('bedId')} error={errors.bedId}>
                                <select
                                    value={values.bedId}
                                    onChange={handleChange('bedId')}
                                    aria-invalid={Boolean(errors.bedId)}
                                >
                                    <option value="">Seleccione la cama</option>
                                    {beds.map((bed) => (
                                        // El backend rechaza sembrar en una cama inactiva.
                                        <option key={bed.bedId} value={bed.bedId} disabled={!bed.active}>
                                            {bed.code} — capacidad {formatQty(bed.maxCapacity)}
                                            {bed.active ? '' : ' · inactiva'}
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

                        <div className="sowing-form-row">
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
                            hint={`${values.notes.length}/${SOWING_LIMITS.notesMax}`}
                        >
                            <textarea
                                maxLength={SOWING_LIMITS.notesMax}
                                value={values.notes}
                                onChange={handleChange('notes')}
                                aria-invalid={Boolean(errors.notes)}
                            />
                        </Field>

                        {submitMessage && (
                            <div
                                className={`sowing-form-message ${submitMessage.type}`}
                                role={submitMessage.type === 'error' ? 'alert' : 'status'}
                            >
                                {submitMessage.text}
                            </div>
                        )}

                        <div className="sowing-form-actions">
                            <button
                                type="button"
                                className="seed-button secondary"
                                onClick={() => navigate('/sowings')}
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

export default SowingFormPage;
