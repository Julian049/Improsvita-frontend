import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllLots } from '../lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import { getLotStatusLabel } from '../lotValidation.js';
import { formatDate } from '../../../utils/dateUtils.js';
import {
    LOT_FILTERS_INITIAL_STATE,
    SORT_OPTIONS,
    filterLots,
    getStockStatus,
    paginateLots,
    searchLots,
    sortLots,
} from './lotListUtils.js';
import '../../seeds/seedsList/SeedList.css';

function LotListPage() {
    const [lots, setLots] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState(LOT_FILTERS_INITIAL_STATE);
    const [sortBy, setSortBy] = useState('entry_desc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        Promise.all([getAllLots(), getAllSeeds(), getLocations()])
            .then(([lotsData, seedsData, locationsData]) => {
                setLots(lotsData);
                setSeeds(seedsData);
                setLocations(locationsData);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el inventario de lotes.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const lotsWithNames = useMemo(() => {
        const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
        const locationNameById = new Map(locations.map((l) => [String(l.locationId), l.locationName]));
        return lots.map((lot) => ({
            ...lot,
            seedName: lot.seedName || seedNameById.get(String(lot.seedId)) || '',
            locationName: lot.locationName || locationNameById.get(String(lot.locationId)) || '',
        }));
    }, [lots, seeds, locations]);

    const statusOptions = useMemo(
        () => [...new Set(lots.map((lot) => lot.status).filter(Boolean))],
        [lots]
    );

    const processedLots = useMemo(() => {
        const searched = searchLots(lotsWithNames, searchText);
        const filtered = filterLots(searched, filters);
        return sortLots(filtered, sortBy);
    }, [lotsWithNames, searchText, filters, sortBy]);

    const { pageItems, totalPages, currentPage } = useMemo(
        () => paginateLots(processedLots, page),
        [processedLots, page]
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
        setFilters(LOT_FILTERS_INITIAL_STATE);
        setSearchText('');
        setPage(1);
    }

    const hasActiveFilters =
        searchText.trim() !== '' || Object.values(filters).some((value) => value !== '');

    if (isLoading) {
        return <div className="seed-list-loading">Cargando inventario de lotes...</div>;
    }

    if (loadError) {
        return <div className="seed-list-message error">{loadError}</div>;
    }

    if (lots.length === 0) {
        return (
            <div className="seed-list-empty">
                <p>No existen lotes registrados en el inventario.</p>
                <Link to="/lots/new" className="seed-button primary">
                    Registrar nuevo lote
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
                    placeholder="Buscar por semilla, ubicación o número de lote..."
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

                <Link to="/lots/new" className="seed-button primary">
                    + Registrar lote
                </Link>
            </div>

            {showFilters && (
                <div className="seed-filters-panel">
                    <label className="seed-field">
                        <span>Semilla</span>
                        <select value={filters.seedId} onChange={handleFilterChange('seedId')}>
                            <option value="">Todas</option>
                            {seeds.map((seed) => (
                                <option key={seed.seedId} value={seed.seedId}>
                                    {seed.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Ubicación</span>
                        <select value={filters.locationId} onChange={handleFilterChange('locationId')}>
                            <option value="">Todas</option>
                            {locations.map((location) => (
                                <option key={location.locationId} value={location.locationId}>
                                    {location.locationName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Estado del lote</span>
                        <select value={filters.status} onChange={handleFilterChange('status')}>
                            <option value="">Todos</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {getLotStatusLabel(status)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Stock</span>
                        <select value={filters.stockStatus} onChange={handleFilterChange('stockStatus')}>
                            <option value="">Todos</option>
                            <option value="available">Disponible</option>
                            <option value="out_of_stock">Agotado</option>
                        </select>
                    </label>

                    <label className="seed-field">
                        <span>Ingreso desde</span>
                        <input type="date" value={filters.entryFrom} onChange={handleFilterChange('entryFrom')} />
                    </label>

                    <label className="seed-field">
                        <span>Ingreso hasta</span>
                        <input type="date" value={filters.entryTo} onChange={handleFilterChange('entryTo')} />
                    </label>

                    <label className="seed-field">
                        <span>Vencimiento desde</span>
                        <input type="date" value={filters.dueFrom} onChange={handleFilterChange('dueFrom')} />
                    </label>

                    <label className="seed-field">
                        <span>Vencimiento hasta</span>
                        <input type="date" value={filters.dueTo} onChange={handleFilterChange('dueTo')} />
                    </label>

                    <button type="button" className="seed-button secondary" onClick={handleClearFilters}>
                        Limpiar filtros
                    </button>
                </div>
            )}

            {processedLots.length === 0 ? (
                <div className="seed-list-message">
                    No se encontraron lotes con los criterios especificados.
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
                                <th>Lote</th>
                                <th>Semilla</th>
                                <th>Ubicación</th>
                                <th>F. ingreso</th>
                                <th>F. vencimiento</th>
                                <th>Inicial</th>
                                <th>Disponible</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageItems.map((lot) => (
                                <tr key={lot.lotId}>
                                    <td>{lot.lotNumber}</td>
                                    <td>{lot.seedName || '—'}</td>
                                    <td>{lot.locationName || '—'}</td>
                                    <td>{formatDate(lot.entryDate)}</td>
                                    <td>{formatDate(lot.dueDate)}</td>
                                    <td>{lot.initialQuantity}</td>
                                    <td>
                                        <span
                                            className={`stock-badge ${
                                                getStockStatus(lot) === 'available' ? 'available' : 'out'
                                            }`}
                                        >
                                            {lot.availableQuantity}
                                        </span>
                                    </td>
                                    <td>{getLotStatusLabel(lot.status)}</td>
                                    <td>
                                        <Link to={`/lots/${lot.lotId}/edit`} className="seed-action-link">
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

export default LotListPage;
