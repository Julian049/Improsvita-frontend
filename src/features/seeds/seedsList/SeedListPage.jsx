import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSeeds, getSuppliers } from '../seedApi.js';
import {
    SEED_FILTERS_INITIAL_STATE,
    SORT_OPTIONS,
    filterSeeds,
    paginateSeeds,
    searchSeeds,
    sortSeeds,
} from './seedListUtils.js';
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
                                        <Link to={`/seeds/${seed.id}/edit`} className="seed-action-link">
                                            Editar
                                        </Link>
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
        </div>
    );
}

export default SeedListPage;
