import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSeeds } from '../seedApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { getAllLots } from '../../lots/lotApi.js';
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

const EXPIRING_DAYS = 30;
const MS_PER_DAY = 864e5;

function daysUntil(dateValue) {
    if (!dateValue) return null;
    const due = new Date(`${String(dateValue).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(due.getTime())) return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Math.round((due - today) / MS_PER_DAY);
}

function formatQty(value) {
    return (Number(value) || 0).toLocaleString('es-CO');
}

function SeedListPage() {
    const navigate = useNavigate();
    const dialogRef = useRef(null);

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
                (data) => ({ data, ok: true }),
                () => ({ data: [], ok: false })
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

    const lotStatsBySeed = useMemo(() => {
        const map = new Map();
        lots.forEach((lot) => {
            const key = String(lot.seedId);
            const current = map.get(key) || { stock: 0, count: 0 };
            current.stock += Number(lot.availableQuantity) || 0;
            current.count += 1;
            map.set(key, current);
        });
        return map;
    }, [lots]);

    const expiringLotsCount = useMemo(
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

    const summary = useMemo(() => {
        const active = seeds.filter((seed) => seed.active).length;
        return { total: seeds.length, active, inactive: seeds.length - active };
    }, [seeds]);

    const processedSeeds = useMemo(() => {
        const searched = searchSeeds(seedsWithSupplierNames, searchText);
        const filtered = filterSeeds(searched, filters);
        return sortSeeds(filtered, sortBy);
    }, [seedsWithSupplierNames, searchText, filters, sortBy]);

    const { pageItems, totalPages, currentPage } = useMemo(
        () => paginateSeeds(processedSeeds, page),
        [processedSeeds, page]
    );

    const selectedSeed = selectedSeedId
        ? seedsWithSupplierNames.find((seed) => String(seed.seedId) === String(selectedSeedId))
        : null;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (selectedSeed && !dialog.open) dialog.showModal();
        if (!selectedSeed && dialog.open) dialog.close();
    }, [selectedSeed]);

    function setFilter(field, value) {
        setFilters((prev) => ({ ...prev, [field]: value }));
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

    function handleCardClick(e, seedId) {
        if (e.target.closest('a, button')) return;
        setSelectedSeedId(seedId);
    }

    function handleCardKeyDown(e, seedId) {
        if (e.key === 'Enter' && e.target.tagName === 'ARTICLE') {
            setSelectedSeedId(seedId);
        }
    }

    function handleSeeLots(seedId) {
        navigate('/lots', { state: { seedId: String(seedId) } });
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

    const selectedStats = selectedSeed
        ? lotStatsBySeed.get(String(selectedSeed.seedId)) || { stock: 0, count: 0 }
        : null;

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
                            const stats = lotStatsBySeed.get(String(seed.seedId)) || { stock: 0, count: 0 };
                            return (
                                <article
                                    key={seed.seedId}
                                    tabIndex={0}
                                    className={`seed-card ${seed.active ? '' : 'off'}`}
                                    onClick={(e) => handleCardClick(e, seed.seedId)}
                                    onKeyDown={(e) => handleCardKeyDown(e, seed.seedId)}
                                >
                                    <div className="seed-card-row">
                                        <h3>{seed.name}</h3>
                                        <span className="seed-type">
                                            {SEED_TYPE_LABELS[seed.type] || seed.type}
                                        </span>
                                    </div>
                                    <span className="seed-state">{seed.active ? 'Activa' : 'Desactivada'}</span>
                                    <p className="seed-desc">{seed.description || '—'}</p>
                                    <div className="seed-meta">
                                        <div>
                                            <span>Stock disponible</span>
                                            {lotsLoaded ? (
                                                <b className={stats.stock ? '' : 'seed-out'}>
                                                    {stats.stock ? `${formatQty(stats.stock)} uds` : 'Agotado'}
                                                </b>
                                            ) : (
                                                <b>—</b>
                                            )}
                                        </div>
                                        <div>
                                            <span>Lotes · Proveedores</span>
                                            <b>
                                                {lotsLoaded ? stats.count : '—'} · {seed.supplierNames.length}
                                            </b>
                                        </div>
                                    </div>
                                    <div className="seed-foot">
                                        <span>Creada {formatDate(seed.createdDate)}</span>
                                        <div className="seed-acts">
                                            <Link to={`/seeds/${seed.seedId}/edit`} className="seed-link">
                                                Editar
                                            </Link>
                                        </div>
                                    </div>
                                </article>
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

            <dialog
                ref={dialogRef}
                className={`seed-dialog ${selectedSeed && !selectedSeed.active ? 'off' : ''}`}
                aria-labelledby="seed-dialog-name"
                onClose={() => setSelectedSeedId(null)}
                onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedSeedId(null);
                }}
            >
                {selectedSeed && (
                    <>
                        <div className="seed-dialog-head">
                            <div>
                                <h2 id="seed-dialog-name">{selectedSeed.name}</h2>
                                <div className="seed-tags">
                                    <span className="seed-type">
                                        {SEED_TYPE_LABELS[selectedSeed.type] || selectedSeed.type}
                                    </span>
                                    <span className="seed-state">
                                        {selectedSeed.active ? 'Activa' : 'Desactivada'}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="seed-x"
                                aria-label="Cerrar"
                                onClick={() => setSelectedSeedId(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="seed-dialog-body">
                            <p>{selectedSeed.description || 'Sin descripción.'}</p>

                            <div className="seed-dk">
                                <div>
                                    <span>Fecha de creación</span>
                                    <b>{formatDate(selectedSeed.createdDate)}</b>
                                </div>
                                {selectedSeed.updatedDate && (
                                    <div>
                                        <span>Última actualización</span>
                                        <b>{formatDate(selectedSeed.updatedDate)}</b>
                                    </div>
                                )}
                                <div>
                                    <span>Stock disponible</span>
                                    {lotsLoaded ? (
                                        <b className={selectedStats.stock ? '' : 'seed-out'}>
                                            {selectedStats.stock ? `${formatQty(selectedStats.stock)} uds` : 'Agotado'}
                                        </b>
                                    ) : (
                                        <b>—</b>
                                    )}
                                </div>
                                <div>
                                    <span>Lotes</span>
                                    {lotsLoaded ? (
                                        <button
                                            type="button"
                                            className="seed-link"
                                            onClick={() => handleSeeLots(selectedSeed.seedId)}
                                        >
                                            {selectedStats.count} {selectedStats.count === 1 ? 'lote' : 'lotes'} · ver →
                                        </button>
                                    ) : (
                                        <b>—</b>
                                    )}
                                </div>
                            </div>

                            <section>
                                <div className="seed-sh">
                                    <h4>Proveedores</h4>
                                    <small>
                                        {selectedSeed.supplierNames.length}{' '}
                                        {selectedSeed.supplierNames.length === 1 ? 'proveedor' : 'proveedores'}
                                    </small>
                                </div>
                                {selectedSeed.supplierNames.length === 0 ? (
                                    <p className="seed-hint">Esta semilla no tiene proveedores asociados.</p>
                                ) : (
                                    <ul className="seed-hl">
                                        {selectedSeed.supplierNames.map((name) => (
                                            <li key={name}>
                                                <i />
                                                <div>
                                                    <b>{name}</b>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>

                        <div className="seed-dialog-foot">
                            <button type="button" className="seed-gh" onClick={() => setSelectedSeedId(null)}>
                                Cerrar
                            </button>
                            <div className="seed-dacts">
                                <Link to={`/seeds/${selectedSeed.seedId}/edit`} className="seed-gh">
                                    Editar
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </dialog>
        </div>
    );
}

export default SeedListPage;
