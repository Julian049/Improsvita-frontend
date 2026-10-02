import { useEffect, useMemo, useRef, useState } from 'react';
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
import './LotList.css';

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

function getLotVariant(lot) {
    const days = daysUntil(lot.dueDate);
    if (getStockStatus(lot) !== 'available') return { variant: 'out', days };
    if (days !== null && days < 0) return { variant: 'expired', days };
    if (days !== null && days <= EXPIRING_DAYS) return { variant: 'expiring', days };
    return { variant: 'available', days };
}

function DueDate({ lot, variant, days }) {
    if (variant === 'expired') {
        return <span className="lot-due-bad">{formatDate(lot.dueDate)} · vencido</span>;
    }
    if (variant === 'expiring') {
        return (
            <span className="lot-due-warn">
                {formatDate(lot.dueDate)} · en {days} {days === 1 ? 'día' : 'días'}
            </span>
        );
    }
    return <span>{formatDate(lot.dueDate)}</span>;
}

function formatQty(value) {
    return (Number(value) || 0).toLocaleString('es-CO');
}

function getLotMovements(lot) {
    if (Array.isArray(lot.movements) && lot.movements.length > 0) {
        return lot.movements.map((m) => ({
            date: m.date,
            isEntry: String(m.type).toUpperCase().startsWith('ENTRY') || String(m.type).toLowerCase() === 'entrada',
            quantity: m.quantity,
            reason: m.reason,
            supplier: m.supplierName,
        }));
    }
    return [
        {
            date: lot.entryDate,
            isEntry: true,
            quantity: lot.initialQuantity,
            reason: 'Compra del lote',
            supplier: lot.supplierName,
        },
    ];
}

function LotDetail({ lot, onBack, onSeeSeedLots }) {
    const { variant, days } = getLotVariant(lot);
    const initial = Number(lot.initialQuantity) || 0;
    const available = Number(lot.availableQuantity) || 0;
    const used = Math.max(initial - available, 0);
    const ratio = initial > 0 ? Math.min(available / initial, 1) : 0;
    const movements = getLotMovements(lot);

    return (
        <>
            <div className="lot-crumb">
                <button type="button" className="lot-link" onClick={onBack}>
                    ← Lotes
                </button>{' '}
                / <span>Lote {lot.lotNumber}</span>
            </div>

            <div className="lot-head">
                <div>
                    <h1>Lote {lot.lotNumber}</h1>
                    <p className="lot-head-sub">
                        <span className={`lot-badge ${variant}`}>{getLotStatusLabel(lot.status)}</span>
                    </p>
                </div>
                <div className="lot-head-actions">
                    {lot.seedId && (
                        <button type="button" className="lot-btn ghost" onClick={() => onSeeSeedLots(lot.seedId)}>
                            Ver lotes de esta semilla
                        </button>
                    )}
                    <Link to={`/lots/${lot.lotId}/edit`} className="lot-btn">
                        Editar lote
                    </Link>
                </div>
            </div>

            <div className="lot-cols">
                <div className="lot-col-main">
                    <section className="lot-box">
                        <h3>Información del lote</h3>
                        <div className="lot-kv">
                            <div>
                                <span>Semilla</span>
                                {lot.seedName ? (
                                    <button type="button" className="lot-link" onClick={() => onSeeSeedLots(lot.seedId)}>
                                        {lot.seedName}
                                    </button>
                                ) : (
                                    <b>—</b>
                                )}
                            </div>
                            <div>
                                <span>Ubicación</span>
                                <b>{lot.locationName || '—'}</b>
                            </div>
                            <div>
                                <span>Fecha de ingreso</span>
                                <b>{formatDate(lot.entryDate)}</b>
                            </div>
                            <div>
                                <span>Fecha de vencimiento</span>
                                <b>
                                    <DueDate lot={lot} variant={variant} days={days} />
                                </b>
                            </div>
                        </div>
                    </section>

                    <section className="lot-box">
                        <h3>Movimientos</h3>
                        <div className="lot-table-wrapper flat">
                            <table className="lot-table">
                                <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Motivo</th>
                                    <th>Proveedor</th>
                                </tr>
                                </thead>
                                <tbody>
                                {movements.map((m, index) => (
                                    <tr key={index} className="static">
                                        <td>{formatDate(m.date)}</td>
                                        <td>{m.isEntry ? 'Entrada' : 'Salida'}</td>
                                        <td className={m.isEntry ? 'lot-mv-in' : 'lot-mv-out'}>
                                            {m.isEntry ? '+' : '−'}
                                            {formatQty(m.quantity)}
                                        </td>
                                        <td>{m.reason || '—'}</td>
                                        <td>{m.supplier || '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <section className="lot-box">
                    <h3>Cantidad</h3>
                    <div className="lot-big">{formatQty(available)}</div>
                    <span className="lot-hint">disponibles de {formatQty(initial)} iniciales</span>
                    <div className="lot-meter large">
                        <i style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <span className="lot-hint">
                        {used > 0 ? `${formatQty(used)} unidades ya salieron del lote` : 'Aún no se ha usado'}
                    </span>
                </section>
            </div>
        </>
    );
}

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
    const [selectedLotId, setSelectedLotId] = useState(null);
    const topRef = useRef(null);

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

    useEffect(() => {
        window.scrollTo(0, 0);
        topRef.current?.scrollIntoView({ block: 'start' });
    }, [selectedLotId]);

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
        setFilters(LOT_FILTERS_INITIAL_STATE);
        setSearchText('');
        setPage(1);
    }

    function handleRowClick(e, lotId) {
        if (e.target.closest('button')) return;
        setSelectedLotId(lotId);
    }

    function handleRowKeyDown(e, lotId) {
        if (e.key === 'Enter' && e.target.tagName === 'TR') {
            setSelectedLotId(lotId);
        }
    }

    function handleSeeSeedLots(seedId) {
        setFilter('seedId', String(seedId));
        setSelectedLotId(null);
    }

    const hasActiveFilters =
        searchText.trim() !== '' || Object.values(filters).some((value) => value !== '');

    const selectedSeedName = filters.seedId
        ? seeds.find((s) => String(s.seedId) === String(filters.seedId))?.name || ''
        : '';

    if (isLoading) {
        return <div className="lot-list-loading">Cargando inventario de lotes...</div>;
    }

    if (loadError) {
        return <div className="lot-list-message error">{loadError}</div>;
    }

    if (lots.length === 0) {
        return (
            <div className="lot-list-empty">
                <p>No existen lotes registrados en el inventario.</p>
                <Link to="/lots/new" className="lot-btn">
                    Registrar nuevo lote
                </Link>
            </div>
        );
    }

    const selectedLot = selectedLotId
        ? lotsWithNames.find((lot) => String(lot.lotId) === String(selectedLotId))
        : null;

    if (selectedLot) {
        return (
            <div className="lot-list-page" ref={topRef}>
                <LotDetail
                    lot={selectedLot}
                    onBack={() => setSelectedLotId(null)}
                    onSeeSeedLots={handleSeeSeedLots}
                />
            </div>
        );
    }

    return (
        <div className="lot-list-page" ref={topRef}>
            <div className="lot-head">
                <h1>Lotes</h1>
                <Link to="/lots/new" className="lot-btn">
                    + Registrar lote
                </Link>
            </div>

            <div className="lot-list-toolbar">
                <input
                    type="search"
                    className="lot-search-input"
                    placeholder="Buscar por número de lote o semilla"
                    aria-label="Buscar lotes"
                    value={searchText}
                    onChange={handleSearchChange}
                />

                <select
                    className="lot-select"
                    aria-label="Semilla"
                    value={filters.seedId}
                    onChange={handleFilterChange('seedId')}
                >
                    <option value="">Todas las semillas</option>
                    {seeds.map((seed) => (
                        <option key={seed.seedId} value={seed.seedId}>
                            {seed.name}
                        </option>
                    ))}
                </select>

                <select
                    className="lot-select"
                    aria-label="Ubicación"
                    value={filters.locationId}
                    onChange={handleFilterChange('locationId')}
                >
                    <option value="">Todas las ubicaciones</option>
                    {locations.map((location) => (
                        <option key={location.locationId} value={location.locationId}>
                            {location.locationName}
                        </option>
                    ))}
                </select>

                <select
                    className="lot-sort-select"
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


            <div className="lot-chips">
                {selectedSeedName && (
                    <div className="lot-active-filter">
                        Semilla: <span>{selectedSeedName}</span>
                        <button
                            type="button"
                            aria-label="Quitar filtro"
                            onClick={() => setFilter('seedId', '')}
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="lot-chips" role="group" aria-label="Estado">
                    <button
                        type="button"
                        className={`lot-chip ${filters.status === '' ? 'on' : ''}`}
                        onClick={() => setFilter('status', '')}
                    >
                        Todos
                    </button>
                    {statusOptions.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`lot-chip ${filters.status === status ? 'on' : ''}`}
                            onClick={() => setFilter('status', status)}
                        >
                            {getLotStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {processedLots.length === 0 ? (
                <div className="lot-list-message">
                    No hay lotes con esos criterios.
                    {hasActiveFilters && (
                        <button type="button" className="lot-link-button" onClick={handleClearFilters}>
                            Limpiar búsqueda y filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="lot-table-wrapper">
                        <table className="lot-table">
                            <thead>
                            <tr>
                                <th>Lote</th>
                                <th>Semilla</th>
                                <th>Ubicación</th>
                                <th>Ingreso</th>
                                <th>Vencimiento</th>
                                <th>Disponible</th>
                                <th>Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageItems.map((lot) => {
                                const { variant, days } = getLotVariant(lot);
                                const initial = Number(lot.initialQuantity) || 0;
                                const available = Number(lot.availableQuantity) || 0;
                                const ratio = initial > 0 ? Math.min(available / initial, 1) : 0;
                                const isLow = available > 0 && ratio < 0.3;

                                return (
                                    <tr
                                        key={lot.lotId}
                                        tabIndex={0}
                                        className={isLow ? 'lot-low' : ''}
                                        onClick={(e) => handleRowClick(e, lot.lotId)}
                                        onKeyDown={(e) => handleRowKeyDown(e, lot.lotId)}
                                    >
                                        <td>
                                            <span className="lot-num">Lote {lot.lotNumber}</span>
                                        </td>
                                        <td>
                                            {lot.seedName ? (
                                                <button
                                                    type="button"
                                                    className="lot-link"
                                                    onClick={() => setFilter('seedId', String(lot.seedId))}
                                                >
                                                    {lot.seedName}
                                                </button>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td>{lot.locationName || '—'}</td>
                                        <td>{formatDate(lot.entryDate)}</td>
                                        <td>
                                            <DueDate lot={lot} variant={variant} days={days} />
                                        </td>
                                        <td className="lot-qty">
                                            <b>{available.toLocaleString('es-CO')}</b>{' '}
                                            <small>de {initial.toLocaleString('es-CO')}</small>
                                            <div className="lot-meter">
                                                <i style={{ width: `${ratio * 100}%` }} />
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`lot-badge ${variant}`}>
                                                {getLotStatusLabel(lot.status)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <nav className="lot-pagination" aria-label="Paginación">
                        <button
                            type="button"
                            className="lot-btn ghost"
                            disabled={currentPage === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                        >
                            Anterior
                        </button>
                        <span>
                            Mostrando {processedLots.length} de {lots.length} · Página {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            className="lot-btn ghost"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Siguiente
                        </button>
                    </nav>
                </>
            )}
        </div>
    );
}

export default LotListPage;
