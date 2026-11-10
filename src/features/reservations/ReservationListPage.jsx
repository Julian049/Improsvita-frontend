import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ModalLink from '../../components/ui/ModalLink.jsx';
import { cancelReservation, getReservations } from './reservationApi';
import { deliverReservation, getSaleAvailability } from '../sales/saleApi';
import { getTodayDateString } from '../sowings/sowingUtils';
import {
    RESERVATION_STATUS,
    RESERVATION_STATUS_OPTIONS,
    getReservationStatusLabel,
    isLiveReservation,
} from './reservationValidation';
import { filterReservations, sortByReservationDate } from './reservationListUtils';
import { getSeedlings } from '../seedlings/seedlingApi';
import { getClients } from '../clients/clientApi';
import { getApiErrorMessage } from '../../api/apiError';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../sowings/sowingsList/SowingList.css';
import './ReservationList.css';

function ReservationCard({ reservation, onCancel, onDeliver }) {
    const canEdit = reservation.status !== RESERVATION_STATUS.CANCELLED;

    return (
        <article className="sowing-card reservation-card">
            <div className="sowing-r1">
                <div>
                    <h4>{reservation.clientName}</h4>
                    <small>{reservation.plantName}</small>
                </div>
                <span className="sowing-tag">$ {formatQty(reservation.totalPrice)}</span>
            </div>

            <div className="sowing-r3">
                <span>Reservada {formatDate(reservation.reservationDate)}</span>
                <span className={`sowing-when reservation-status-tag-${String(reservation.status).toLowerCase()}`}>
                    {getReservationStatusLabel(reservation.status)}
                </span>
            </div>

            {reservation.notes && <p className="reservation-notes">{reservation.notes}</p>}

            {canEdit && (
                <div className="reservation-acts">
                    <Link
                        to={`/reservations/${reservation.reservationId}/edit`}
                        className="reservation-link"
                    >
                        Editar
                    </Link>
                    {reservation.status === RESERVATION_STATUS.CONFIRMED && (
                        <button
                            type="button"
                            className="reservation-link"
                            onClick={() => onDeliver(reservation)}
                        >
                            Entregar
                        </button>
                    )}
                    {isLiveReservation(reservation) && (
                        <button
                            type="button"
                            className="reservation-link danger"
                            onClick={() => onCancel(reservation)}
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}

function ReservationListPage() {
    const [reservations, setReservations] = useState([]);
    const [clientNameById, setClientNameById] = useState(new Map());
    const [plantNameById, setPlantNameById] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [toCancel, setToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [toDeliver, setToDeliver] = useState(null);
    const [isDelivering, setIsDelivering] = useState(false);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        Promise.all([
            getReservations(),
            getClients().catch(() => []),
            getSeedlings().catch(() => []),
        ])
            .then(([reservationsData, clients, sowings]) => {
                setReservations(reservationsData);
                setClientNameById(new Map(clients.map((client) => [String(client.clientId), client.name])));
                setPlantNameById(
                    new Map(
                        sowings.map((sowing) => [
                            String(sowing.sowingId),
                            `${sowing.seedName || 'Siembra'} · Lote ${sowing.lotNumber || '—'}`,
                        ])
                    )
                );
            })
            .catch(() => setLoadError('No se pudo cargar la lista de reservas.'))
            .finally(() => setIsLoading(false));
    }, []);

    const namedReservations = useMemo(
        () =>
            reservations.map((reservation) => ({
                ...reservation,
                clientName:
                    clientNameById.get(String(reservation.clientId)) ??
                    `Cliente #${reservation.clientId}`,
                plantName:
                    plantNameById.get(String(reservation.sowingId)) ??
                    `Siembra #${reservation.sowingId}`,
            })),
        [reservations, clientNameById, plantNameById]
    );
    const visibleReservations = useMemo(
        () => filterReservations(namedReservations, query),
        [namedReservations, query]
    );
    const columns = RESERVATION_STATUS_OPTIONS.filter(
        (option) => !statusFilter || option.value === statusFilter
    );

    function applyUpdated(updated) {
        setReservations((prev) =>
            prev.map((reservation) =>
                String(reservation.reservationId) === String(updated.reservationId)
                    ? { ...reservation, ...updated }
                    : reservation
            )
        );
    }

    async function handleConfirmDeliver() {
        setIsDelivering(true);
        setActionError(null);
        try {
            const availability = await getSaleAvailability(toDeliver.sowingId);
            const quantity = Number(availability?.available) || 0;
            if (quantity <= 0) {
                throw { userMessage: 'No hay plántulas disponibles para entregar esta reserva.' };
            }

            const unitPrice = Number((Number(toDeliver.totalPrice) / quantity).toFixed(2));
            await deliverReservation({
                reservationId: toDeliver.reservationId,
                quantity,
                unitPrice,
                saleDate: getTodayDateString(),
                notes: toDeliver.notes,
            });
            applyUpdated({ ...toDeliver, status: RESERVATION_STATUS.DELIVERED });
        } catch (err) {
            setActionError(
                getApiErrorMessage(err, 'No se pudo confirmar la entrega. Intenta nuevamente.')
            );
        } finally {
            setIsDelivering(false);
            setToDeliver(null);
        }
    }

    async function handleConfirmCancel() {
        setIsCancelling(true);
        setActionError(null);
        try {
            applyUpdated(await cancelReservation(toCancel.reservationId));
        } catch (err) {
            setActionError(
                getApiErrorMessage(err, 'No se pudo cancelar la reserva. Intenta nuevamente.')
            );
        } finally {
            setIsCancelling(false);
            setToCancel(null);
        }
    }

    function renderContent() {
        if (isLoading) return <div className="sowing-list-loading">Cargando reservas...</div>;
        if (loadError) return <div className="sowing-list-message error">{loadError}</div>;
        if (reservations.length === 0) {
            return <div className="sowing-list-message">No existen reservas registradas.</div>;
        }

        return (
            <div className="sowing-board reservation-board" style={{ '--cols': columns.length }}>
                {columns.map((step) => {
                    const items = sortByReservationDate(
                        visibleReservations.filter((reservation) => reservation.status === step.value)
                    );
                    return (
                        <section
                            key={step.value}
                            className={`sowing-col reservation-status-${step.value.toLowerCase()}`}
                            aria-label={step.label}
                        >
                            <div className="sowing-ch">
                                <i />
                                {step.label}
                                <span>{items.length}</span>
                            </div>

                            {items.length === 0 ? (
                                <div className="sowing-none">
                                    {query.trim() ? 'Sin coincidencias' : 'Sin reservas'}
                                </div>
                            ) : (
                                items.map((reservation) => (
                                    <ReservationCard
                                        key={reservation.reservationId}
                                        reservation={reservation}
                                        onCancel={setToCancel}
                                        onDeliver={setToDeliver}
                                    />
                                ))
                            )}
                        </section>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="sowing-list-page">
            <div className="sowing-head">
                <div>
                    <h1>Reservas</h1>
                    <p className="page-subtitle">
                        Reservas activas, entregas pendientes y disponibilidad comprometida.
                    </p>
                </div>
                <ModalLink to="/reservations/new" className="seed-button primary">
                    + Registrar reserva
                </ModalLink>
            </div>

            <div className="reservation-bar">
                <input
                    type="search"
                    className="reservation-search"
                    placeholder="Buscar por cliente o siembra"
                    aria-label="Buscar reservas por cliente o siembra"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <div className="reservation-chips" role="group" aria-label="Filtrar por estado">
                    {[{ value: '', label: 'Todas' }, ...RESERVATION_STATUS_OPTIONS].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`reservation-chip ${statusFilter === option.value ? 'on' : ''}`}
                            aria-pressed={statusFilter === option.value}
                            onClick={() => setStatusFilter(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {actionError && <div className="sowing-list-message error">{actionError}</div>}

            {renderContent()}

            {toDeliver && (
                <ConfirmDialog
                    title="Confirmar entrega"
                    message="¿Confirmar la entrega? Se registrará la venta en el historial y la reserva quedará entregada."
                    details={`${toDeliver.clientName} · ${toDeliver.plantName} · $ ${formatQty(
                        toDeliver.totalPrice
                    )}`}
                    confirmLabel="Confirmar entrega"
                    cancelLabel="Volver"
                    isConfirming={isDelivering}
                    onConfirm={handleConfirmDeliver}
                    onCancel={() => setToDeliver(null)}
                />
            )}

            {toCancel && (
                <ConfirmDialog
                    title="Cancelar reserva"
                    message="¿Desea cancelar la reserva? La siembra volverá a quedar disponible."
                    details={`${toCancel.clientName} · ${toCancel.plantName} · $ ${formatQty(
                        toCancel.totalPrice
                    )}`}
                    confirmLabel="Cancelar reserva"
                    cancelLabel="Volver"
                    isConfirming={isCancelling}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setToCancel(null)}
                />
            )}
        </div>
    );
}

export default ReservationListPage;
