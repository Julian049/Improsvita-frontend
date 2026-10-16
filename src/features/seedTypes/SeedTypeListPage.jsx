import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteSeedType, getSeedTypes } from './seedTypeApi';
import { getSeedTypeLabel } from './seedTypeUtils';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getApiErrorMessage } from '../../api/apiError';
import '../../components/ui/Catalog.css';

function SeedTypeListPage() {
    const navigate = useNavigate();
    const [seedTypes, setSeedTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [typeToDelete, setTypeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {    
        getSeedTypes()
            .then(setSeedTypes)
            .catch(() => setLoadError('No se pudo cargar la lista de tipos de semilla.'))
            .finally(() => setIsLoading(false));
    }, []);

        async function handleConfirmDelete() {
        const target = typeToDelete;
        setIsDeleting(true);
        setMessage(null);
        try {
            await deleteSeedType(target.seedTypeId);
            setSeedTypes((prev) => prev.filter((t) => t.seedTypeId !== target.seedTypeId));
        } catch (err) {
            const inUse = err.response?.status === 409;
            setMessage({
                type: 'error',
                text: inUse
                    ? `No se puede eliminar el tipo "${getSeedTypeLabel(target.name)}" porque tiene semillas asociadas.`
                    : getApiErrorMessage(err, 'No se pudo eliminar el tipo de semilla.'),
                typeName: inUse ? target.name : null,
            });
        } finally {
            setIsDeleting(false);
            setTypeToDelete(null);
        }
    }

    function renderContent() {
        if (isLoading) return <div className="catalog-message">Cargando tipos de semilla...</div>;
        if (loadError) return <div className="catalog-message error">{loadError}</div>;
        if (seedTypes.length === 0) {
            return <div className="catalog-message">No hay tipos de semilla registrados todavía.</div>;
        }

        return (
            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {seedTypes.map((seedType) => (
                        <tr key={seedType.seedTypeId}>
                            <td>{getSeedTypeLabel(seedType.name)}</td>
                            <td>{seedType.description || '—'}</td>
                            <td className="catalog-actions">
                                <Link to={`/seed-types/${seedType.seedTypeId}/edit`} className="catalog-link">
                                    Editar
                                </Link>
                                <button
                                    type="button"
                                    className="catalog-link danger"
                                    onClick={() => setTypeToDelete(seedType)}
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
                <h1>Tipos de semilla</h1>
                <Link to="/seed-types/new" className="seed-button primary">
                    + Registrar tipo
                </Link>
            </div>

            {message && (
                <div className={`catalog-form-message ${message.type}`}>
                    {message.text}
                    {message.typeName && (
                        <>
                            {' '}
                            <button
                                type="button"
                                className="catalog-link"
                                onClick={() => navigate(`/seeds?type=${encodeURIComponent(message.typeName)}`)}
                            >
                                Ver semillas
                            </button>
                        </>
                    )}
                </div>
            )}

            {renderContent()}

            {typeToDelete && (
                <ConfirmDialog
                    title="Eliminar tipo de semilla"
                    message="¿Seguro que desea eliminar este tipo? Solo se puede eliminar si no tiene semillas asociadas."
                    details={getSeedTypeLabel(typeToDelete.name)}
                    confirmLabel="Eliminar"
                    isConfirming={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setTypeToDelete(null)}
                />
            )}
        </div>
    );
}

export default SeedTypeListPage;