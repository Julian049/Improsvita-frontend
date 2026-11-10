import { useEffect, useMemo, useState } from 'react';
import { getSales } from '../sales/saleApi';
import { getReservations } from '../reservations/reservationApi';
import { RESERVATION_STATUS } from '../reservations/reservationValidation';
import { getSeedlings } from '../seedlings/seedlingApi';
import { getClients } from '../clients/clientApi';
import { printReceipt } from './receipt';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../../components/ui/Catalog.css';

function HistoryPage() {
    const [sales, setSales] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [clientNameById, setClientNameById] = useState(new Map());
    const [plantNameById, setPlantNameById] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        Promise.all([
            getSales(),
            getReservations({ status: RESERVATION_STATUS.DELIVERED }),
            getClients().catch(() => []),
            getSeedlings().catch(() => []),
        ])
            .then(([salesData, reservationsData, clients, sowings]) => {
                setSales(salesData);
                setDeliveries(reservationsData);
                setClientNameById(new Map(clients.map((c) => [String(c.clientId), c.name])));
                setPlantNameById(
                    new Map(
                        sowings.map((s) => [
                            String(s.sowingId),
                            `${s.seedName || 'Siembra'} · Lote ${s.lotNumber || '—'}`,
                        ])
                    )
                );
            })
            .catch(() => setLoadError('No se pudo cargar el historial.'))
            .finally(() => setIsLoading(false));
    }, []);

    const entries = useMemo(() => {
        const named = (clientId, sowingId) => ({
            clientName: clientNameById.get(String(clientId)) ?? `Cliente #${clientId}`,
            plantName: plantNameById.get(String(sowingId)) ?? `Siembra #${sowingId}`,
        });
        const activeSales = sales.filter((sale) => sale.active !== false);
        const billedReservations = new Set(
            activeSales
                .filter((sale) => sale.reservationId != null)
                .map((sale) => String(sale.reservationId))
        );
        return [
            ...activeSales.map((sale) => ({
                key: `sale-${sale.id}`,
                reference: `V-${sale.id}`,
                typeLabel: sale.saleType === 'RESERVATION' ? 'Entrega de reserva' : 'Venta directa',
                date: sale.saleDate,
                quantity: sale.quantity,
                unitPrice: sale.unitPrice,
                totalPrice: sale.total,
                notes: sale.notes,
                ...named(sale.contactId, sale.sowingId),
            })),
            ...deliveries
                .filter((reservation) => !billedReservations.has(String(reservation.reservationId)))
                .map((reservation) => ({
                    key: `reservation-${reservation.reservationId}`,
                    reference: `R-${reservation.reservationId}`,
                    typeLabel: 'Entrega de reserva',
                    date: reservation.reservationDate,
                    quantity: null,
                    unitPrice: null,
                    totalPrice: reservation.totalPrice,
                    notes: reservation.notes,
                    ...named(reservation.clientId, reservation.sowingId),
                })),
        ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }, [sales, deliveries, clientNameById, plantNameById]);

    function handleReceipt(entry) {
        setNotice(
            printReceipt(entry)
                ? null
                : 'El navegador bloqueó la ventana del comprobante. Permite las ventanas emergentes e inténtalo de nuevo.'
        );
    }

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando historial...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (entries.length === 0) {
            return <div className="catalog-message">Todavía no hay ventas ni entregas.</div>;
        }

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Cliente</th>
                            <th>Siembra</th>
                            <th className="catalog-number">Cantidad</th>
                            <th className="catalog-number">Total</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.key}>
                                <td>{formatDate(entry.date)}</td>
                                <td>
                                    <span
                                        className={`catalog-badge ${
                                            entry.typeLabel === 'Venta directa' ? 'sale' : 'reservation'
                                        }`}
                                    >
                                        {entry.typeLabel}
                                    </span>
                                </td>
                                <td>{entry.clientName}</td>
                                <td>{entry.plantName}</td>
                                <td className="catalog-number">
                                    {entry.quantity != null ? formatQty(entry.quantity) : '—'}
                                </td>
                                <td className="catalog-number">$ {formatQty(entry.totalPrice)}</td>
                                <td className="catalog-actions">
                                    <button
                                        type="button"
                                        className="catalog-action-button"
                                        onClick={() => handleReceipt(entry)}
                                    >
                                        Comprobante
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="catalog-head">
                <div>
                    <h1>Historial</h1>
                    <p className="page-subtitle">
                        Consulta ventas directas y entregas de reserva con su comprobante.
                    </p>
                </div>
            </div>
            {notice && <div className="catalog-message error">{notice}</div>}
            {renderContent()}
        </div>
    );
}

export default HistoryPage;
