import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getAllSeeds} from '../seedApi.js';
import {getSuppliers} from '../../suppliers/supplierApi';
import {getAllLots} from '../../lots/lotApi.js';
import {SEED_TYPE_OPTIONS} from '../seedValidation.js';
import {daysUntil} from '../../../utils/daysUntil';
import {
    SEED_FILTERS_INITIAL_STATE,
    SORT_OPTIONS,
    filterSeeds,
    paginateSeeds,
    searchSeeds,
    sortSeeds,
} from './seedListUtils.js';
import {SeedCard} from './SeedCard';
import {SeedDetailModal} from './SeedDetailModal';
import './SeedList.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const EXPIRING_DAYS = 30;

const sumStock = (lots) => lots.reduce((total, lot) => total + (Number(lot.availableQuantity) || 0), 0);

export const SeedListPage = () => {
    const navigate = useNavigate();

    const [seeds, setSeeds] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [lots, setLots] = useState([]);
    const [lotsLoaded, setLotsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState(SEED_FILTERS_INITIAL_STATE);
    const [sortBy, setSortBy] = useState('name_asc');
    const [page, setPage] = useState(1);
    const [selectedSeedId, setSelectedSeedId] = useState(null);

    useEffect(() => {
        Promise.all([
            getAllSeeds(),
            getSuppliers(),
            getAllLots().then(
                (data) => ({data, ok: true}),
                () => ({data: [], ok: false})
            ),
        ])
            .then(([seedsData, suppliersData, lotsResult]) => {
                setSeeds(seedsData);
                setSuppliers(suppliersData);
                setLots(lotsResult.data);
                setLotsLoaded(lotsResult.ok);
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

    const lotsBySeed = useMemo(() => {
        const map = new Map();
        lots.forEach((lot) => {
            const key = String(lot.seedId);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(lot);
        });
        return map;
    }, [lots]);
    useMemo(
        () =>
            lots.filter((lot) => {
                const days = daysUntil(lot.dueDate);
                return (
                    (Number(lot.availableQuantity) || 0) > 0 &&
                    days !== null &&
                    days >= 0 &&
                    days <= EXPIRING_DAYS
                );
            }).length,
        [lots]
    );
    useMemo(() => {
        const active = seeds.filter((seed) => seed.active).length;
        return {total: seeds.length, active, inactive: seeds.length - active};
    }, [seeds]);
    const processedSeeds = useMemo(() => {
        const searched = searchSeeds(seedsWithSupplierNames, searchText);
        const filtered = filterSeeds(searched, filters);
        return sortSeeds(filtered, sortBy);
    }, [seedsWithSupplierNames, searchText, filters, sortBy]);

    const {pageItems, totalPages, currentPage} = useMemo(
        () => paginateSeeds(processedSeeds, page),
        [processedSeeds, page]
    );

    const selectedSeed = selectedSeedId
        ? seedsWithSupplierNames.find((seed) => String(seed.seedId) === String(selectedSeedId)) || null
        : null;
    const selectedLots = selectedSeed ? lotsBySeed.get(String(selectedSeed.seedId)) || [] : [];

    function setFilter(field, value) {
        setFilters((prev) => ({...prev, [field]: value}));
        setPage(1);
    }

    function handleFilterChange(field) {
        return (e) => setFilter(field, e.target.value);
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

    function handleSeeLots(seedId) {
        navigate('/lots', {state: {seedId: String(seedId)}});
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
                <Link to="/seeds/new" className="seed-btn">
                    Registrar nueva semilla
                </Link>
            </div>
        );
    }

    return (
        <div className="seed-list-page">
            <div className="seed-head">
                <div>
                    <h1>Semillas</h1>
                </div>
                <Link to="/seeds/new" className="seed-btn">
                    + Registrar semilla
                </Link>
            </div>

            <div className="seed-list-toolbar">
                <input
                    type="search"
                    className="seed-search-input"
                    placeholder="Buscar por nombre, descripción o proveedor"
                    aria-label="Buscar semillas"
                    value={searchText}
                    onChange={handleSearchChange}
                />

                <select
                    className="seed-select"
                    aria-label="Tipo"
                    value={filters.type}
                    onChange={handleFilterChange('type')}
                >
                    <option value="">Todos los tipos</option>
                    {SEED_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className="seed-select"
                    aria-label="Ordenar"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="seed-chips" role="group" aria-label="Estado">
                <button
                    type="button"
                    className={`seed-chip ${filters.active === '' ? 'on' : ''}`}
                    onClick={() => setFilter('active', '')}
                >
                    Todas
                </button>
                <button
                    type="button"
                    className={`seed-chip ${filters.active === 'true' ? 'on' : ''}`}
                    onClick={() => setFilter('active', 'true')}
                >
                    Activas
                </button>
                <button
                    type="button"
                    className={`seed-chip red ${filters.active === 'false' ? 'on' : ''}`}
                    onClick={() => setFilter('active', 'false')}
                >
                    Desactivadas
                </button>
            </div>

            {processedSeeds.length === 0 ? (
                <div className="seed-list-message">
                    No hay semillas con esos criterios.
                    {hasActiveFilters && (
                        <button type="button" className="seed-link" onClick={handleClearFilters}>
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <section className="seed-grid" aria-live="polite">
                        {pageItems.map((seed) => {
                            const seedLots = lotsBySeed.get(String(seed.seedId)) || [];
                            return (
                                <SeedCard
                                    key={seed.seedId}
                                    seed={seed}
                                    typeLabel={SEED_TYPE_LABELS[seed.type] || seed.type}
                                    stock={sumStock(seedLots)}
                                    lotCount={seedLots.length}
                                    lotsLoaded={lotsLoaded}
                                    onSelect={setSelectedSeedId}
                                />
                            );
                        })}
                    </section>

                    <nav className="seed-pagination" aria-label="Paginación">
                        <button
                            type="button"
                            className="seed-btn ghost"
                            disabled={currentPage === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                        >
                            Anterior
                        </button>
                        <span>
                            Mostrando {processedSeeds.length} de {seeds.length} · Página {currentPage} de{' '}
                            {totalPages}
                        </span>
                        <button
                            type="button"
                            className="seed-btn ghost"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Siguiente
                        </button>
                    </nav>
                </>
            )}

            <SeedDetailModal
                seed={selectedSeed}
                typeLabel={selectedSeed ? SEED_TYPE_LABELS[selectedSeed.type] || selectedSeed.type : ''}
                lots={selectedLots}
                stock={sumStock(selectedLots)}
                lotsLoaded={lotsLoaded}
                onSeeLots={handleSeeLots}
                onClose={() => setSelectedSeedId(null)}
            />
        </div>
    );
};

export default SeedListPage;
