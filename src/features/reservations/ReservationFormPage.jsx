import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../hooks/useGoBack';
import { createReservation, getReservationById, getReservations, updateReservation } from './reservationApi';
import {
    RESERVATION_FIELD_LABELS,
    getAvailableSeedlings,
    getReservationFormInitialValues,
    getReservationStatusLabel,
    validateReservationForm,
} from './reservationValidation';
import { getSeedlings } from '../seedlings/seedlingApi';
import { SOWING_STATUS } from '../sowings/sowingStatus';
import { getSuppliers } from '../suppliers/supplierApi';
import { getApiErrorMessage } from '../../api/apiError';
import { formatQty } from '../../utils/numberUtils';
import SearchSelect from '../../components/ui/SearchSelect.jsx';
import '../../components/ui/Catalog.css';

function ReservationFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const goBack = useGoBack('/reservations');

    const [values, setValues] = useState(getReservationFormInitialValues);
    const [status, setStatus] = useState('RESERVED');
    const [clients, setClients] = useState([]);
    const [seedlings, setSeedlings] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        Promise.all([
            // SUPUESTO: no existe módulo de clientes; el SRS los incluye en Contactos, que hoy solo tiene proveedores.
            getSuppliers(),
            getSeedlings(),
            getReservations(),
            isEditing ? getReservationById(id) : null,
        ])
            .then(([clientsData, seedlingsData, reservationsData, reservation]) => {
                setClients(clientsData);
                setSeedlings(seedlingsData);
                setReservations(reservationsData);
                if (reservation) {
                    setValues({
                        clientId: String(reservation.clientId ?? ''),
                        sowingId: String(reservation.sowingId ?? ''),
                        quantity: String(reservation.quantity),
                        reservationDate: reservation.reservationDate || '',
                        deliveryDate: reservation.deliveryDate || '',
                    });
                    setStatus(reservation.status);
                }
            })
            .catch(() => setLoadError(isEditing ? 'No se pudo cargar la reserva.' : 'No se pudieron cargar los datos del formulario.'))
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    // SRS RF 5.2: solo se editan reservas activas (no entregadas ni canceladas).
    const isLocked = isEditing && status !== 'RESERVED';

    const seedlingOptions = useMemo(
        () =>
            seedlings
                // Las siembras fallidas o canceladas no tienen plántulas que reservar.
                .filter(
                    (s) =>
                        ![SOWING_STATUS.FAILED, SOWING_STATUS.CANCELLED].includes(s.status) ||
                        String(s.sowingId) === values.sowingId
                )
                .map((s) => {
                    const available = getAvailableSeedlings(s, reservations, id);
                    return {
                        value: s.sowingId,
                        label: `${s.seedName || 'Siembra'} · Lote ${s.lotNumber || '—'} · Cama ${s.bedCode || '—'} (${formatQty(available)} disponibles)`,
                        available,
                    };
                }),
        [seedlings, reservations, id, values.sowingId]
    );
    const maxQuantity = seedlingOptions.find((o) => String(o.value) === values.sowingId)?.available;

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateReservationForm(values, { maxQuantity });
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors).map((f) => RESERVATION_FIELD_LABELS[f] || f).join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            await (isEditing ? updateReservation(id, values) : createReservation(values));
            goBack();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(
                    err,
                    isEditing
                        ? 'No se pudo actualizar la reserva. Intenta nuevamente.'
                        : 'No se pudo registrar la reserva. Intenta nuevamente.'
                ),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="catalog-message">Cargando reserva...</div>;
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
                <h2>{isEditing ? 'Modificar reserva' : 'Registrar reserva'}</h2>
                <p className="catalog-form-subtitle">
                    {isEditing
                        ? `Estado: ${getReservationStatusLabel(status)}`
                        : 'La reserva se registra con estado "Reservada".'}
                </p>

                {isLocked && (
                    <div className="catalog-form-message error">
                        Esta reserva está {getReservationStatusLabel(status).toLowerCase()} y no se puede modificar.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <fieldset disabled={isLocked} style={{ display: 'contents' }}>
                        <label className="catalog-field">
                            <span>Cliente *</span>
                            <SearchSelect
                                value={values.clientId}
                                onChange={handleChange('clientId')}
                                disabled={isLocked}
                                placeholder="Busca un cliente"
                                aria-label="Cliente"
                                options={clients.map((c) => ({ value: c.supplierId, label: c.name }))}
                            />
                            {errors.clientId && <small className="field-error">{errors.clientId}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Planta *</span>
                            <SearchSelect
                                value={values.sowingId}
                                onChange={handleChange('sowingId')}
                                disabled={isLocked}
                                placeholder="Busca una planta"
                                aria-label="Planta"
                                options={seedlingOptions}
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
                            {errors.quantity ? (
                                <small className="field-error">{errors.quantity}</small>
                            ) : (
                                maxQuantity != null && <small>{`Máximo ${formatQty(maxQuantity)} disponibles.`}</small>
                            )}
                        </label>

                        <label className="catalog-field">
                            <span>Fecha de reserva *</span>
                            <input type="date" value={values.reservationDate} onChange={handleChange('reservationDate')} />
                            {errors.reservationDate && <small className="field-error">{errors.reservationDate}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Fecha prevista de entrega *</span>
                            <input
                                type="date"
                                min={values.reservationDate || undefined}
                                value={values.deliveryDate}
                                onChange={handleChange('deliveryDate')}
                            />
                            {errors.deliveryDate && <small className="field-error">{errors.deliveryDate}</small>}
                        </label>
                    </fieldset>

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                    )}

                    <div className="catalog-form-actions">
                        <button type="button" className="seed-button secondary" onClick={() => navigate('/reservations')}>
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting || isLocked}>
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReservationFormPage;
