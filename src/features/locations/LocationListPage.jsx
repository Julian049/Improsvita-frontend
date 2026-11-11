import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ModalLink from '../../components/ui/ModalLink.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getApiErrorMessage } from '../../api/apiError';
import { deleteLocation, getLocations } from './locationApi';
import '../../components/ui/Catalog.css';

function LocationListPage() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        getLocations()
            .then(setLocations)
            .catch(() => setLoadError('No se pudo cargar la lista de ubicaciones.'))
            .finally(() => setIsLoading(false));
    }, []);

    async function handleDelete() {
        setIsDeleting(true);
        setActionError(null);
        try {
            await deleteLocation(toDelete.locationId);
            setLocations((prev) => prev.filter((item) => item.locationId !== toDelete.locationId));
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo eliminar la ubicación.'));
        } finally {
            setIsDeleting(false);
            setToDelete(null);
        }
    }

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
                                <button
                                    type="button"
                                    className="catalog-link danger"
                                    onClick={() => setToDelete(location)}
                                >
                                    Eliminar
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
                    <h1>Ubicaciones</h1>
                    <p className="page-subtitle">
                        Bodegas y espacios donde se almacena el inventario.
                    </p>
                </div>
                <ModalLink to="/locations/new" className="seed-button primary">
                    + Registrar ubicación
                </ModalLink>
            </div>
            {actionError && <div className="catalog-message error">{actionError}</div>}
            {renderContent()}

            {toDelete && (
                <ConfirmDialog
                    title="Eliminar ubicación"
                    message={`¿Eliminar "${toDelete.locationName}"? Esta acción no se puede deshacer.`}
                    confirmLabel="Eliminar"
                    isConfirming={isDeleting}
                    onConfirm={handleDelete}
                    onCancel={() => setToDelete(null)}
                />
            )}
        </div>
    );
}

export default LocationListPage;
