import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBeds } from './bedApi';
import { formatQty } from '../../utils/numberUtils';
import '../../components/ui/Catalog.css';

function BedListPage() {
    const [beds, setBeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        getBeds()
            .then(setBeds)
            .catch(() => setLoadError('No se pudo cargar la lista de camas.'))
            .finally(() => setIsLoading(false));
    }, []);

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando camas...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (beds.length === 0) {
            return <div className="catalog-message">No hay camas registradas todavía.</div>;
        }

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Código</th>
                        <th>Capacidad máxima</th>
                        <th>Estado</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {beds.map((bed) => (
                        <tr key={bed.bedId}>
                            <td>{bed.code}</td>
                            <td>{bed.maxCapacity > 0 ? formatQty(bed.maxCapacity) : '—'}</td>
                            <td>
                                <span className={`catalog-badge ${bed.active ? '' : 'off'}`}>
                                    {bed.active ? 'Activa' : 'Inactiva'}
                                </span>
                            </td>
                            <td className="catalog-actions">
                                <Link to={`/beds/${bed.bedId}/edit`} className="catalog-link">
                                    Editar
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
                <h1>Camas</h1>
                <Link to="/beds/new" className="seed-button primary">
                    + Registrar cama
                </Link>
            </div>
            {renderContent()}
        </div>
    );
}

export default BedListPage;
