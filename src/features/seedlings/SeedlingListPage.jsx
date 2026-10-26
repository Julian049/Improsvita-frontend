import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSeedlings } from './seedlingApi';
import { SOWING_STATUS, getSowingStatusLabel, isTerminalStatus } from '../sowings/sowingStatus';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../../components/ui/Catalog.css';

// Las siembras fallidas o canceladas no dejan plántulas.
const HIDDEN_STATUSES = [SOWING_STATUS.FAILED, SOWING_STATUS.CANCELLED];

const qtyOrDash = (value) => (value == null ? '—' : formatQty(value));

function SeedlingListPage() {
    const [sowings, setSowings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        getSeedlings()
            .then((data) => setSowings(data.filter((s) => !HIDDEN_STATUSES.includes(s.status))))
            .catch(() => setLoadError('No se pudo cargar la lista de plántulas.'))
            .finally(() => setIsLoading(false));
    }, []);

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando plántulas...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (sowings.length === 0) {
            return <div className="catalog-message">No hay siembras con plántulas todavía.</div>;
        }

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Semilla</th>
                        <th>Origen</th>
                        <th>Sembradas</th>
                        <th>Estimadas</th>
                        <th>Germinadas</th>
                        <th>Siembra</th>
                        <th>Estado</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {sowings.map((sowing) => (
                        <tr key={sowing.sowingId}>
                            <td>{sowing.seedName || '—'}</td>
                            <td>
                                Lote {sowing.lotNumber || '—'} · Cama {sowing.bedCode || '—'}
                            </td>
                            <td>{formatQty(sowing.quantitySown)}</td>
                            <td>{qtyOrDash(sowing.estimatedSeedlings)}</td>
                            <td>{qtyOrDash(sowing.germinatedQuantity)}</td>
                            <td>{formatDate(sowing.sowingDate)}</td>
                            <td>
                                <span className="catalog-badge">{getSowingStatusLabel(sowing.status)}</span>
                            </td>
                            <td className="catalog-actions">
                                <Link to={`/seedlings/${sowing.sowingId}/reviews`} className="catalog-link">
                                    {isTerminalStatus(sowing.status) ? 'Ver revisiones' : 'Registrar revisión'}
                                </Link>
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
                <h1>Plántulas</h1>
            </div>
            {renderContent()}
        </div>
    );
}

export default SeedlingListPage;
