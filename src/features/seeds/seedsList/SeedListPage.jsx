import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getSeeds} from '../seedApi.js';
import {getSuppliers} from '../../suppliers/supplierApi';
import {getAllLots} from '../../lots/lotApi.js';
import {SEED_TYPE_OPTIONS} from '../seedValidation.js';
import {
    SEED_FILTER_INITIAL_STATE,
    SEED_FILTER_MODES,
    paginateSeeds,
} from './seedListUtils.js';
import {SeedCard} from './SeedCard';
import {SeedDetailModal} from './SeedDetailModal';
import './SeedList.css';

const SEED_TYPE_LABELS = Object.fromEntries(
    SEED_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const sumStock = (lots) => lots.reduce((total, lot) => total + (Number(lot.availableQuantity) || 0), 0);

export const SeedListPage = () => {
    const navigate = useNavigate();

    const [seeds, setSeeds] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [lots, setLots] = useState([]);
    const [lotsLoaded, setLotsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [isFetchingSeeds, setIsFetchingSeeds] = useState(true);
    const [seedsError, setSeedsError] = useState(null);

    const [draftMode, setDraftMode] = useState('');
    const [draftValue, setDraftValue] = useState('');
    const [filterError, setFilterError] = useState('');
    const [appliedFilter, setAppliedFilter] = useState(SEED_FILTER_INITIAL_STATE);

    const [page, setPage] = useState(1);
    const [selectedSeedId, setSelectedSeedId] = useState(null);

    useEffect(() => {
        Promise.all([
            getSuppliers(),
            getAllLots().then(
                (data) => ({data, ok: true}),
                () => ({data: [], ok: false})
            ),
        ])
            .then(([suppliersData, lotsResult]) => {
                setSuppliers(suppliersData);
                setLots(lotsResult.data);
                setLotsLoaded(lotsResult.ok);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el catálogo de semillas.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setIsFetchingSeeds(true);
        setSeedsError(null);

        getSeeds(appliedFilter)
            .then((data) => {
                if (!cancelled) setSeeds(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setSeeds([]);
                    setSeedsError('No se pudo cargar el catálogo de semillas.');
                }
            })
            .finally(() => {
                if (!cancelled) setIsFetchingSeeds(false);
            });

        return () => {
            cancelled = true;
        };
    }, [appliedFilter]);

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

    const {pageItems, totalPages, currentPage} = useMemo(
        () => paginateSeeds(seedsWithSupplierNames, page),
        [seedsWithSupplierNames, page]
    );

    const selectedSeed = selectedSeedId
        ? seedsWithSupplierNames.find((seed) => String(seed.seedId) === String(selectedSeedId)) || null
        : null;
    const selectedLots = selectedSeed ? lotsBySeed.get(String(selectedSeed.seedId)) || [] : [];

    const hasAppliedFilter = appliedFilter.mode !== '';

    function applyFilter(next) {
        setAppliedFilter(next);
        setPage(1);
        setFilterError('');
    }

    function handleModeChange(e) {
        setDraftMode(e.target.value);
        setDraftValue('');
        setFilterError('');
        if (hasAppliedFilter) applyFilter(SEED_FILTER_INITIAL_STATE);
    }

    function handleSelectValueChange(e) {
        const value = e.target.value;
        setDraftValue(value);
        applyFilter(value ? {mode: draftMode, value} : SEED_FILTER_INITIAL_STATE);
    }

    function handleSubmit(e) {
        e.preventDefault();
        const value = draftValue.trim();

        if (draftMode === 'stock') {
            if (value === '' || Number.isNaN(Number(value)) || Number(value) < 0) {
                setFilterError('Ingresa un número válido (0 o mayor).');
                return;
            }
        }
        if (draftMode === 'name' && value === '') {
            setFilterError('Ingresa el nombre exacto de la semilla.');
            return;
        }
        if (!draftMode) return;

        applyFilter({mode: draftMode, value});
    }

    function handleClearFilter() {
        setDraftMode('');
        setDraftValue('');
        applyFilter(SEED_FILTER_INITIAL_STATE);
    }

    function handleSeeLots(seedId) {
        navigate('/lots', {state: {seedId: String(seedId)}});
    }

    function renderValueControl() {
        switch (draftMode) {
            case 'type':
                return (
                    <select
                        className="seed-select"
                        aria-label="Tipo"
                        value={draftValue}
                        onChange={handleSelectValueChange}
                    >
                        <option value="">Selecciona un tipo</option>
                        {SEED_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
            case 'supplier':
                return (
                    <select
                        className="seed-select"
                        aria-label="Proveedor"
                        value={draftValue}
                        onChange={handleSelectValueChange}
                    >
                        <option value="">Selecciona un proveedor</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.supplierId} value={supplier.supplierId}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                );
            case 'stock':
                return (
                    <>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="seed-search-input"
                            placeholder="Ej: 50"
                            aria-label="Stock menor a"
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                        />
                        <button type="submit" className="seed-btn">Aplicar</button>
                    </>
                );
            case 'name':
                return (
                    <>
                        <input
                            type="search"
                            className="seed-search-input"
                            placeholder="Nombre exacto de la semilla"
                            aria-label="Nombre exacto"
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                        />
                        <button type="submit" className="seed-btn">Aplicar</button>
                    </>
                );
            default:
                return null;
        }
    }

    if (isLoading) {
        return <div className="seed-list-loading">Cargando catálogo de semillas...</div>;
    }

    if (loadError) {
        return <div className="seed-list-message error">{loadError}</div>;
    }

    if (!isFetchingSeeds && !seedsError && !hasAppliedFilter && seeds.length === 0) {
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

            <form className="seed-list-toolbar" onSubmit={handleSubmit}>
                <select
                    className="seed-select"
                    aria-label="Filtrar por"
                    value={draftMode}
                    onChange={handleModeChange}
                >
                    {SEED_FILTER_MODES.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {renderValueControl()}

                {(hasAppliedFilter || draftMode !== '') && (
                    <button type="button" className="seed-btn ghost" onClick={handleClearFilter}>
                        Limpiar filtro
                    </button>
                )}
            </form>

            {filterError && <div className="seed-list-message error">{filterError}</div>}

            {isFetchingSeeds ? (
                <div className="seed-list-loading">Cargando semillas...</div>
            ) : seedsError ? (
                <div className="seed-list-message error">{seedsError}</div>
            ) : seeds.length === 0 ? (
                <div className="seed-list-message">
                    No hay semillas con ese filtro.
                    <button type="button" className="seed-link" onClick={handleClearFilter}>
                        Limpiar filtro
                    </button>
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
                            {seeds.length} {seeds.length === 1 ? 'semilla' : 'semillas'} · Página {currentPage} de{' '}
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
