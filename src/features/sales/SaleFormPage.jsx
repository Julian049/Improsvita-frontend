import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSale } from './saleApi';
import { SALE_FIELD_LABELS, getSaleFormInitialValues, validateSaleForm } from './saleValidation';
import { getSeedlingCount, getSeedlings } from '../seedlings/seedlingApi';
import { getClients } from '../clients/clientApi';
import { getReservations } from '../reservations/reservationApi';
import { isLiveReservation } from '../reservations/reservationValidation';
import { SOWING_STATUS } from '../sowings/sowingStatus';
import { getApiErrorMessage } from '../../api/apiError';
import { formatQty } from '../../utils/numberUtils';
import SearchSelect from '../../components/ui/SearchSelect.jsx';
import '../../components/ui/Catalog.css';

const SELLABLE_STATUSES = [
    SOWING_STATUS.PLANNED,
    SOWING_STATUS.IN_PROGRESS,
    SOWING_STATUS.COMPLETED,
];

function SaleFormPage() {
    const navigate = useNavigate();

    const [values, setValues] = useState(getSaleFormInitialValues);
    const [clients, setClients] = useState([]);
    const [seedlings, setSeedlings] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        Promise.all([getClients(), getSeedlings(), getReservations()])
            .then(([clientsData, seedlingsData, reservationsData]) => {
                setClients(clientsData);
                setSeedlings(seedlingsData);
                setReservations(reservationsData);
            })
            .catch(() => setLoadError('No se pudieron cargar los datos del formulario.'))
            .finally(() => setIsLoading(false));
    }, []);

    const reservationsBySowing = useMemo(() => {
        const liveBySowing = new Set();
        reservations.filter(isLiveReservation).forEach((reservation) => {
            liveBySowing.add(String(reservation.sowingId));
        });
        return liveBySowing;
    }, [reservations]);

    const sellable = useMemo(
        () =>
            seedlings.filter(
                (sowing) =>
                    SELLABLE_STATUSES.includes(sowing.status) &&
                    getSeedlingCount(sowing) > 0 &&
                    !reservationsBySowing.has(String(sowing.sowingId))
            ),
        [seedlings, reservationsBySowing]
    );
    const sowingOptions = useMemo(
        () =>
            sellable.map((sowing) => {
                const count = getSeedlingCount(sowing);
                return {
                    value: sowing.sowingId,
                    label: `${sowing.seedName || 'Siembra'} · Lote ${sowing.lotNumber || '—'} · Cama ${sowing.bedCode || '—'} · ${formatQty(count)} disponibles`,
                };
            }),
        [sellable]
    );
    const selected = sellable.find((sowing) => String(sowing.sowingId) === values.sowingId);
    const available = selected ? getSeedlingCount(selected) : null;

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function refreshSeedlings() {
        try {
            setSeedlings(await getSeedlings());
        } catch {
            // La venta ya se registró; si falla el refresco se conserva el stock anterior.
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSaleForm(values, available);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors)
                .map((field) => SALE_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            await createSale(values);
            setValues(getSaleFormInitialValues());
            setSubmitMessage({ type: 'success', text: 'Venta registrada correctamente.' });
            await refreshSeedlings();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo registrar la venta. Intenta nuevamente.'),
            });
            await refreshSeedlings();
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="catalog-message">Cargando datos de venta...</div>;
    if (loadError) {
        return (
            <div className="catalog-page">
                <div className="catalog-message error">{loadError}</div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card catalog-form-card-wide">
                <h2>Venta directa</h2>
                <p className="catalog-form-subtitle">
                    Registra la venta de plántulas de una siembra sin reserva previa.
                </p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <div className="catalog-form-grid">
                        <label className="catalog-field">
                            <span>Cliente *</span>
                            <SearchSelect
                                value={values.clientId}
                                onChange={handleChange('clientId')}
                                placeholder="Busca un cliente"
                                aria-label="Cliente"
                                options={clients.map((client) => ({
                                    value: client.clientId,
                                    label: client.name,
                                }))}
                            />
                            {errors.clientId && <small className="field-error">{errors.clientId}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Siembra *</span>
                            <SearchSelect
                                value={values.sowingId}
                                onChange={handleChange('sowingId')}
                                placeholder="Busca una siembra"
                                aria-label="Siembra"
                                options={sowingOptions}
                            />
                            {errors.sowingId && <small className="field-error">{errors.sowingId}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Cantidad *</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                className="no-spinner"
                                value={values.quantity}
                                onChange={handleChange('quantity')}
                            />
                            {available != null && (
                                <small>Disponibles: {formatQty(available)} plántulas</small>
                            )}
                            {errors.quantity && <small className="field-error">{errors.quantity}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Precio unitario *</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                className="no-spinner"
                                value={values.unitPrice}
                                onChange={handleChange('unitPrice')}
                            />
                            {values.quantity !== '' && values.unitPrice !== '' && (
                                <small>
                                    Total: $ {formatQty(Number(values.quantity) * Number(values.unitPrice))}
                                </small>
                            )}
                            {errors.unitPrice && <small className="field-error">{errors.unitPrice}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Fecha de venta *</span>
                            <input
                                type="date"
                                value={values.saleDate}
                                onChange={handleChange('saleDate')}
                            />
                            {errors.saleDate && <small className="field-error">{errors.saleDate}</small>}
                        </label>

                        <label className="catalog-field catalog-field-wide">
                            <span>Notas</span>
                            <textarea rows="2" value={values.notes} onChange={handleChange('notes')} />
                        </label>
                    </div>

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="catalog-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Registrar venta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SaleFormPage;
