import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteSeedling, getSeedlings, getSowingOrigins } from './seedlingApi';
import { getSeedlingStatusLabel } from './seedlingValidation';
import { getApiErrorMessage } from '../../api/apiError';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import '../../components/ui/Catalog.css';

// SUPUESTO: módulo construido sin backend (ver "Plántulas" en CLAUDE.md).
function SeedlingListPage() {
    const [seedlings, setSeedlings] = useState([]);
    const [origins, setOrigins] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        Promise.all([getSeedlings(), getSowingOrigins().catch(() => new Map())])
            .then(([seedlingsData, originsData]) => {
                setSeedlings(seedlingsData);
                setOrigins(originsData);
            })
            .catch(() => setLoadError('No se pudo cargar la lista de plántulas.'))
            .finally(() => setIsLoading(false));
    }, []);

    const originOf = (seedling) => origins.get(String(seedling.sowingId)) ?? {};

    async function handleConfirmDelete() {
        const seedling = toDelete;
        setIsDeleting(true);
        try {
            await deleteSeedling(seedling.seedlingId);
            setSeedlings((prev) => prev.filter((s) => s.seedlingId !== seedling.seedlingId));
            setMessage({ type: 'success', text: 'Plántulas eliminadas.' });
        } catch (err) {
            setMessage({ type: 'error', text: getApiErrorMessage(err, 'No se pudieron eliminar las plántulas. Intenta nuevamente.') });
        } finally {
            setIsDeleting(false);
            setToDelete(null);
        }
    }

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando plántulas...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (seedlings.length === 0) return <div className="catalog-message">No hay plántulas registradas todavía.</div>;

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Semilla</th>
                        <th>Origen</th>
                        <th>Cantidad</th>
                        <th>Fecha lista</th>
                        <th>Estado</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {seedlings.map((seedling) => {
                        const origin = originOf(seedling);
                        return (
                            <tr key={seedling.seedlingId}>
                                <td>{origin.seedName || '—'}</td>
                                <td>
                                    Lote {origin.lotNumber || '—'} · Cama {origin.bedCode || '—'}
                                </td>
                                <td>{formatQty(seedling.quantity)}</td>
                                <td>{seedling.readyDate ? formatDate(seedling.readyDate) : '—'}</td>
                                <td>
                                    <span className={`catalog-badge ${seedling.status === 'DISCARDED' ? 'off' : ''}`}>
                                        {getSeedlingStatusLabel(seedling.status)}
                                    </span>
                                </td>
                                <td className="catalog-actions">
                                    <Link to={`/seedlings/${seedling.seedlingId}/edit`} className="catalog-link">
                                        Editar
                                    </Link>
                                    <button
                                        type="button"
                                        className="catalog-link danger"
                                        onClick={() => {
                                            setMessage(null);
                                            setToDelete(seedling);
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
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

            {message && <div className={`catalog-form-message ${message.type}`}>{message.text}</div>}
            {renderContent()}

            {toDelete && (
                <ConfirmDialog
                    title="Eliminar plántulas"
                    message="¿Seguro que desea eliminar este registro de plántulas? No se podrá recuperar."
                    details={`${originOf(toDelete).seedName || 'Plántulas'} · ${formatQty(toDelete.quantity)} uds · Lote ${originOf(toDelete).lotNumber || '—'}`}
                    confirmLabel="Eliminar"
                    isConfirming={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setToDelete(null)}
                />
            )}
        </div>
    );
}

export default SeedlingListPage;
