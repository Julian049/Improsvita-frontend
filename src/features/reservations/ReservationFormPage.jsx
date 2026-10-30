import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../hooks/useGoBack';
import {
    createReservation,
    getReservationById,
    getReservations,
    updateReservation,
} from './reservationApi';
import {
    EDITABLE_STATUS_OPTIONS,
    RESERVATION_FIELD_LABELS,
    RESERVATION_STATUS,
    getReservationFormInitialValues,
    getReservationStatusLabel,
    isLiveReservation,
    validateReservationForm,
} from './reservationValidation';
import { getSeedlings } from '../seedlings/seedlingApi';
import { getClients } from '../clients/clientApi';
import { SOWING_STATUS } from '../sowings/sowingStatus';
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
            getClients(),
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
                        totalPrice: String(reservation.totalPrice ?? ''),
                        reservationDate: reservation.reservationDate || '',
                        notes: reservation.notes || '',
                        status: reservation.status || RESERVATION_STATUS.PENDING,
                    });
                }
            })
            .catch(() =>
                setLoadError(
                    isEditing
                        ? 'No se pudo cargar la reserva.'
                        : 'No se pudieron cargar los datos del formulario.'
                )
            )
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    const status = values.status;
    const isLocked =
        isEditing &&
        (status === RESERVATION_STATUS.DELIVERED || status === RESERVATION_STATUS.CANCELLED);

    const sowingOptions = useMemo(
        () =>
            seedlings
                .filter(
                    (sowing) =>
                        [SOWING_STATUS.PLANNED, SOWING_STATUS.IN_PROGRESS].includes(sowing.status) ||
                        String(sowing.sowingId) === values.sowingId
                )
                .filter(
                    (sowing) =>
                        !reservations.some(
                            (reservation) =>
                                isLiveReservation(reservation) &&
                                String(reservation.sowingId) === String(sowing.sowingId) &&
                                String(reservation.reservationId) !== String(id)
                        ) || String(sowing.sowingId) === values.sowingId
                )
                .map((sowing) => {
                    const seedlingsAvailable = sowing.germinatedQuantity ?? sowing.estimatedSeedlings;
                    const seedlingsText =
                        seedlingsAvailable != null
                            ? ` · ${formatQty(seedlingsAvailable)} plántulas`
                            : '';
                    return {
                        value: sowing.sowingId,
                        label: `${sowing.seedName || 'Siembra'} · Lote ${sowing.lotNumber || '—'} · Cama ${sowing.bedCode || '—'}${seedlingsText}`,
                    };
                }),
        [seedlings, reservations, id, values.sowingId]
    );

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateReservationForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors)
                .map((field) => RESERVATION_FIELD_LABELS[field] || field)
                .join(', ');
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
                        : 'La reserva se registra con estado "Pendiente".'}
                </p>

                {isLocked && (
                    <div className="catalog-form-message error">
                        Esta reserva está {getReservationStatusLabel(status).toLowerCase()} y no se puede
                        modificar.
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
                                disabled={isLocked}
                                placeholder="Busca una siembra"
                                aria-label="Siembra"
                                options={sowingOptions}
                            />
                            {errors.sowingId && <small className="field-error">{errors.sowingId}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Precio total *</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                className="no-spinner"
                                value={values.totalPrice}
                                onChange={handleChange('totalPrice')}
                            />
                            {errors.totalPrice && <small className="field-error">{errors.totalPrice}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Fecha de reserva *</span>
                            <input
                                type="date"
                                value={values.reservationDate}
                                onChange={handleChange('reservationDate')}
                            />
                            {errors.reservationDate && (
                                <small className="field-error">{errors.reservationDate}</small>
                            )}
                        </label>

                        {isEditing && (
                            <label className="catalog-field">
                                <span>Estado</span>
                                <select value={values.status} onChange={handleChange('status')}>
                                    {EDITABLE_STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <label className="catalog-field">
                            <span>Notas</span>
                            <textarea
                                rows="3"
                                value={values.notes}
                                onChange={handleChange('notes')}
                            />
                        </label>
                    </fieldset>

                    {submitMessage && (
                        <div className={`catalog-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="catalog-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/reservations')}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="seed-button primary"
                            disabled={isSubmitting || isLocked}
                        >
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReservationFormPage;
