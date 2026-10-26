import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelReservation, getReservations } from './reservationApi';
import { RESERVATION_STATUS_OPTIONS } from './reservationValidation';
import { filterReservations, getDeliveryTiming } from './reservationListUtils';
import { getSeedlings } from '../seedlings/seedlingApi';
import { getSuppliers } from '../suppliers/supplierApi';
import { getApiErrorMessage } from '../../api/apiError';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../sowings/sowingsList/SowingList.css';
import './ReservationList.css';

function ReservationCard({ reservation, onCancel }) {
    const timing = getDeliveryTiming(reservation);
    const isActive = reservation.status === 'RESERVED';

    return (
        <article className="sowing-card reservation-card">
            <div className="sowing-r1">
                <div>
                    <h4>{reservation.clientName}</h4>
                    <small>{reservation.plantName}</small>
                </div>
                <span className="sowing-tag">{formatQty(reservation.quantity)} und.</span>
            </div>

            <div className="sowing-r3">
                <span>
                    Reservada {formatDate(reservation.reservationDate)} · entrega {formatDate(reservation.deliveryDate)}
                </span>
                {timing && <span className={`sowing-when ${timing.level}`}>{timing.label}</span>}
            </div>

            {isActive && (
                <div className="reservation-acts">
                    <Link to={`/reservations/${reservation.reservationId}/edit`} className="reservation-link">
                        Editar
                    </Link>
                    <button type="button" className="reservation-link danger" onClick={() => onCancel(reservation)}>
                        Cancelar
                    </button>
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
            // SUPUESTO: los clientes salen de Contactos (proveedores) hasta que exista un módulo de clientes.
            getSuppliers().catch(() => []),
            getSeedlings().catch(() => []),
        ])
            .then(([reservationsData, clients, sowings]) => {
                setReservations(reservationsData);
                setClientNameById(new Map(clients.map((c) => [String(c.supplierId), c.name])));
                setPlantNameById(
                    new Map(sowings.map((s) => [String(s.sowingId), `${s.seedName || 'Siembra'} · Lote ${s.lotNumber || '—'}`]))
                );
            })
            .catch(() => setLoadError('No se pudo cargar la lista de reservas.'))
            .finally(() => setIsLoading(false));
    }, []);

    const namedReservations = useMemo(
        () =>
            reservations.map((r) => ({
                ...r,
                clientName: clientNameById.get(String(r.clientId)) ?? `Cliente #${r.clientId}`,
                plantName: plantNameById.get(String(r.sowingId)) ?? `Siembra #${r.sowingId}`,
            })),
        [reservations, clientNameById, plantNameById]
    );
    const visibleReservations = useMemo(
        () => filterReservations(namedReservations, query),
        [namedReservations, query]
    );
    const columns = RESERVATION_STATUS_OPTIONS.filter((s) => !statusFilter || s.value === statusFilter);

    async function handleConfirmCancel() {
        setIsCancelling(true);
        setActionError(null);
        try {
            const updated = await cancelReservation(toCancel.reservationId);
            setReservations((prev) =>
                prev.map((r) => (String(r.reservationId) === String(updated.reservationId) ? { ...r, ...updated } : r))
            );
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo cancelar la reserva. Intenta nuevamente.'));
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
                    const items = visibleReservations
                        .filter((r) => r.status === step.value)
                        .sort((a, b) => String(a.deliveryDate).localeCompare(String(b.deliveryDate)));
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
                                <div className="sowing-none">{query.trim() ? 'Sin coincidencias' : 'Sin reservas'}</div>
                            ) : (
                                items.map((r) => (
                                    <ReservationCard key={r.reservationId} reservation={r} onCancel={setToCancel} />
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
                    placeholder="Buscar por cliente o planta"
                    aria-label="Buscar reservas por cliente o planta"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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
                    message="¿Desea cancelar la reserva? Las plántulas reservadas vuelven a quedar disponibles."
                    details={`${toCancel.clientName} · ${toCancel.plantName} · ${formatQty(toCancel.quantity)} und.`}
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
