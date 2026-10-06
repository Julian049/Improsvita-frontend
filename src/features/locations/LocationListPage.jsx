import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLocations } from './locationApi';
import '../../components/ui/Catalog.css';

function LocationListPage() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        getLocations()
            .then(setLocations)
            .catch(() => setLoadError('No se pudo cargar la lista de ubicaciones.'))
            .finally(() => setIsLoading(false));
    }, []);

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando ubicaciones...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (locations.length === 0) {
            return <div className="catalog-message">No hay ubicaciones registradas todavía.</div>;
        }

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {locations.map((location) => (
                        <tr key={location.locationId}>
                            <td>{location.locationName}</td>
                            <td>
                                <span className={`catalog-badge ${location.active ? '' : 'off'}`}>
                                    {location.active ? 'Activa' : 'Inactiva'}
                                </span>
                            </td>
                            <td className="catalog-actions">
                                <Link to={`/locations/${location.locationId}/edit`} className="catalog-link">
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
                <h1>Ubicaciones</h1>
                <Link to="/locations/new" className="seed-button primary">
                    + Registrar ubicación
                </Link>
            </div>
            {renderContent()}
        </div>
    );
}

export default LocationListPage;
