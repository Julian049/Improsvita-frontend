import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSeeds } from '../seedApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { SEED_TYPE_OPTIONS } from '../seedValidation.js';
import { formatDate } from '../../../utils/dateUtils.js';
import {
    SEED_FILTERS_INITIAL_STATE,
    SORT_OPTIONS,
    filterSeeds,
    paginateSeeds,
    searchSeeds,
    sortSeeds,
} from './seedListUtils.js';
import './SeedList.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

function SeedListPage() {
    const [seeds, setSeeds] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState(SEED_FILTERS_INITIAL_STATE);
    const [sortBy, setSortBy] = useState('name_asc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        Promise.all([getAllSeeds(), getSuppliers()])
            .then(([seedsData, suppliersData]) => {
                setSeeds(seedsData);
                setSuppliers(suppliersData);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el catálogo de semillas.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const seedsWithSupplierNames = useMemo(() => {
        const nameById = new Map(suppliers.map((s) => [String(s.supplierId), s.name]));
        return seeds.map((seed) => ({
            ...seed,
            supplierNames:
                seed.supplierNames.length > 0
                    ? seed.supplierNames
                    : seed.supplierIds.map((id) => nameById.get(String(id))).filter(Boolean),
        }));
    }, [seeds, suppliers]);

    const processedSeeds = useMemo(() => {
        const searched = searchSeeds(seedsWithSupplierNames, searchText);
        const filtered = filterSeeds(searched, filters);
        return sortSeeds(filtered, sortBy);
    }, [seedsWithSupplierNames, searchText, filters, sortBy]);

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
        searchText.trim() !== '' || Object.values(filters).some((value) => value !== '');

    if (isLoading) {
        return <div className="seed-list-loading">Cargando catálogo de semillas...</div>;
    }

    if (loadError) {
        return <div className="seed-list-message error">{loadError}</div>;
    }

    if (seeds.length === 0) {
        return (
            <div className="seed-list-empty">
                <p>No existen semillas registradas en el catálogo.</p>
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
                    placeholder="Buscar por nombre, descripción o proveedor..."
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
                                <option key={supplier.supplierId} value={supplier.supplierId}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Tipo</span>
                        <select value={filters.type} onChange={handleFilterChange('type')}>
                            <option value="">Todos</option>
                            {SEED_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Estado</span>
                        <select value={filters.active} onChange={handleFilterChange('active')}>
                            <option value="">Todos</option>
                            <option value="true">Activa</option>
                            <option value="false">Inactiva</option>
                        </select>
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
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Proveedores</th>
                                <th>Estado</th>
                                <th>Creada</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageItems.map((seed) => (
                                <tr key={seed.seedId}>
                                    <td>{seed.name}</td>
                                    <td>{SEED_TYPE_LABELS[seed.type] || seed.type}</td>
                                    <td>{seed.description || '—'}</td>
                                    <td>{seed.supplierNames.join(', ') || '—'}</td>
                                    <td>
                                        <span className={`stock-badge ${seed.active ? 'available' : 'out'}`}>
                                            {seed.active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td>{formatDate(seed.createdDate)}</td>
                                    <td>
                                        <Link to={`/seeds/${seed.seedId}/edit`} className="seed-action-link">
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
