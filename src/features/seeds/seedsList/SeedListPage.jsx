import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteSeed, getAllSeeds, getSuppliers } from '../seedApi';
import {
    SEED_FILTERS_INITIAL_STATE,
    SORT_OPTIONS,
    filterSeeds,
    paginateSeeds,
    searchSeeds,
    sortSeeds,
} from './seedListUtils';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import './SeedList.css';

function formatDate(dateString) {
    if (!dateString) return '—';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function SeedListPage() {
    const [seeds, setSeeds] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState(SEED_FILTERS_INITIAL_STATE);
    const [sortBy, setSortBy] = useState('acquisition_desc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const [seedPendingDelete, setSeedPendingDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteFeedback, setDeleteFeedback] = useState(null);

    useEffect(() => {
        Promise.all([getAllSeeds(), getSuppliers()])
            .then(([seedsData, suppliersData]) => {
                setSeeds(seedsData);
                setSuppliers(suppliersData);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el inventario de semillas.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const seedsWithSupplierName = useMemo(() => {
        const supplierNameById = new Map(suppliers.map((s) => [String(s.id), s.name]));
        return seeds.map((seed) => ({
            ...seed,
            supplierName: seed.supplierName || supplierNameById.get(String(seed.supplierId)) || '',
        }));
    }, [seeds, suppliers]);

    const processedSeeds = useMemo(() => {
        const searched = searchSeeds(seedsWithSupplierName, searchText);
        const filtered = filterSeeds(searched, filters);
        return sortSeeds(filtered, sortBy);
    }, [seedsWithSupplierName, searchText, filters, sortBy]);

    const { pageItems, totalPages, currentPage } = useMemo(
        () => paginateSeeds(processedSeeds, page),
        [processedSeeds, page]
    );

    function handleFilterChange(field) {
        return (e) => {
            setFilters((prev) => ({ ...prev, [field]: e.target.value }));
            setPage(1);
        };
    }

    function handleSearchChange(e) {
        setSearchText(e.target.value);
        setPage(1);
    }

    function handleClearFilters() {
        setFilters(SEED_FILTERS_INITIAL_STATE);
        setSearchText('');
        setPage(1);
    }

    function handleRequestDelete(seed) {
        setDeleteFeedback(null);
        setSeedPendingDelete(seed);
    }


    function handleCancelDelete() {
        setSeedPendingDelete(null);
    }

    async function handleConfirmDelete() {
        if (!seedPendingDelete) return;

        setIsDeleting(true);
        try {
            await deleteSeed(seedPendingDelete.id);

            setSeeds((prev) => prev.filter((s) => s.id !== seedPendingDelete.id));
            setDeleteFeedback({ type: 'success', text: 'Semilla eliminada exitosamente.' }); // MSJ10
            setSeedPendingDelete(null);
        } catch (err) {
            const status = err.response?.status;

            if (status === 404) {
                setDeleteFeedback({
                    type: 'error',
                    text: 'La semilla seleccionada no existe o ya fue eliminada.',
                });
                setSeeds((prev) => prev.filter((s) => s.id !== seedPendingDelete.id));
            } else if (status === 409) {
                setDeleteFeedback({
                    type: 'error',
                    text:
                        'No es posible eliminar la semilla porque está asociada a siembras, plántulas o reservas activas.',
                });
            } else {
                setDeleteFeedback({
                    type: 'error',
                    text: 'Error al eliminar la semilla. Intente nuevamente o contacte al administrador.',
                });
            }
            setSeedPendingDelete(null);
        } finally {
            setIsDeleting(false);
        }
    }

    const hasActiveFilters =
        searchText.trim() !== '' ||
        Object.values(filters).some((value) => value !== '');

    if (isLoading) {
        return <div className="seed-list-loading">Cargando inventario de semillas...</div>;
    }

    if (loadError) {
        return <div className="seed-list-message error">{loadError}</div>;
    }

    if (seeds.length === 0) {
        return (
            <div className="seed-list-empty">
                <p>No existen semillas registradas en el inventario.</p>
                <Link to="/seeds/new" className="seed-button primary">
                    Registrar nueva semilla
                </Link>
            </div>
        );
    }

    return (
        <div className="seed-list-page">
            <div className="seed-list-toolbar">
                <input
                    type="text"
                    className="seed-search-input"
                    placeholder="Buscar por nombre, variedad o proveedor..."
                    value={searchText}
                    onChange={handleSearchChange}
                />

                <select
                    className="seed-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="seed-button secondary"
                    onClick={() => setShowFilters((prev) => !prev)}
                >
                    Filtros {showFilters ? '▲' : '▼'}
                </button>

                <Link to="/seeds/new" className="seed-button primary">
                    + Registrar semilla
                </Link>
            </div>

            {deleteFeedback && (
                <div className={`seed-list-message ${deleteFeedback.type}`}>
                    {deleteFeedback.text}
                </div>
            )}

            {showFilters && (
                <div className="seed-filters-panel">
                    <label className="seed-field">
                        <span>Proveedor</span>
                        <select value={filters.supplierId} onChange={handleFilterChange('supplierId')}>
                            <option value="">Todos</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Estado de stock</span>
                        <select value={filters.stockStatus} onChange={handleFilterChange('stockStatus')}>
                            <option value="">Todos</option>
                            <option value="available">Disponible</option>
                            <option value="out_of_stock">Agotado</option>
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Adquisición desde</span>
                        <input
                            type="date"
                            value={filters.acquisitionFrom}
                            onChange={handleFilterChange('acquisitionFrom')}
                        />
                    </label>

                    <label className="seed-field">
                        <span>Adquisición hasta</span>
                        <input
                            type="date"
                            value={filters.acquisitionTo}
                            onChange={handleFilterChange('acquisitionTo')}
                        />
                    </label>

                    <label className="seed-field">
                        <span>Vencimiento desde</span>
                        <input
                            type="date"
                            value={filters.expirationFrom}
                            onChange={handleFilterChange('expirationFrom')}
                        />
                    </label>

                    <label className="seed-field">
                        <span>Vencimiento hasta</span>
                        <input
                            type="date"
                            value={filters.expirationTo}
                            onChange={handleFilterChange('expirationTo')}
                        />
                    </label>

                    <button type="button" className="seed-button secondary" onClick={handleClearFilters}>
                        Limpiar filtros
                    </button>
                </div>
            )}

            {processedSeeds.length === 0 ? (
                <div className="seed-list-message">
                    No se encontraron semillas con los criterios especificados.
                    {hasActiveFilters && (
                        <button type="button" className="seed-link-button" onClick={handleClearFilters}>
                            Limpiar búsqueda y filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="seed-table-wrapper">
                        <table className="seed-table">
                            <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Variedad</th>
                                <th>Proveedor</th>
                                <th>Cantidad</th>
                                <th>F. adquisición</th>
                                <th>F. vencimiento</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageItems.map((seed) => (
                                <tr key={seed.id}>
                                    <td>{seed.plantName}</td>
                                    <td>{seed.variety}</td>
                                    <td>{seed.supplierName || '—'}</td>
                                    <td>
                                            <span
                                                className={`stock-badge ${
                                                    Number(seed.quantity) > 0 ? 'available' : 'out'
                                                }`}
                                            >
                                                {seed.quantity}
                                            </span>
                                    </td>
                                    <td>{formatDate(seed.acquisitionDate)}</td>
                                    <td>{formatDate(seed.expirationDate)}</td>
                                    <td>
                                        <div className="seed-row-actions">
                                            <Link to={`/seeds/${seed.id}/edit`} className="seed-action-link">
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                className="seed-action-link danger"
                                                onClick={() => handleRequestDelete(seed)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="seed-pagination">
                        <button
                            type="button"
                            className="seed-button secondary"
                            disabled={currentPage === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                        >
                            Anterior
                        </button>
                        <span>
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            className="seed-button secondary"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}

            {seedPendingDelete && (
                <ConfirmDialog
                    title="Eliminar semilla"
                    message={`¿Estás seguro de que deseas eliminar esta semilla? Esta acción no se puede deshacer.`}
                    details={
                        <>
                            <strong>{seedPendingDelete.plantName}</strong> — {seedPendingDelete.variety}
                            <br />
                            Cantidad disponible: {seedPendingDelete.quantity}
                        </>
                    }
                    confirmLabel="Eliminar"
                    isDangerous
                    isConfirming={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </div>
    );
}

export default SeedListPage;
