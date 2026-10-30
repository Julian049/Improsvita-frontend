import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelReservation, getReservations } from './reservationApi';
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

function ReservationCard({ reservation, onCancel }) {
    const canEdit =
        reservation.status !== RESERVATION_STATUS.DELIVERED &&
        reservation.status !== RESERVATION_STATUS.CANCELLED;

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

    async function handleConfirmCancel() {
        setIsCancelling(true);
        setActionError(null);
        try {
            const updated = await cancelReservation(toCancel.reservationId);
            setReservations((prev) =>
                prev.map((reservation) =>
                    String(reservation.reservationId) === String(updated.reservationId)
                        ? { ...reservation, ...updated }
                        : reservation
                )
            );
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
                </div>
                <Link to="/reservations/new" className="seed-button primary">
                    + Registrar reserva
                </Link>
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
