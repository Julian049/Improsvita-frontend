import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLotKardex, getLots } from '../lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { LOT_STATUS_LABELS, getLotStatusLabel } from '../lotValidation.js';
import { formatDate } from '../../../utils/dateUtils.js';
import { getExpirationStatus } from '../../../utils/expirationStatus.js';
import { formatQty } from '../../../utils/numberUtils.js';
import {
    LOT_FILTER_INITIAL_STATE,
    LOT_FILTER_MODES,
    getStockStatus,
    paginateLots,
} from './lotListUtils.js';
import './LotList.css';

function getLotVariant(lot) {
    const expiration = getExpirationStatus(lot.dueDate);
    if (getStockStatus(lot) !== 'available') return { variant: 'out', expiration };
    if (expiration.level === 'expired') return { variant: 'expired', expiration };
    if (expiration.level === 'critical' || expiration.level === 'warning') {
        return { variant: 'expiring', expiration };
    }
    return { variant: 'available', expiration };
}

function DueDate({ lot, variant, expiration }) {
    if (variant === 'expired') {
        return (
            <span className="lot-due-bad">
                {formatDate(lot.dueDate)} · {expiration.label}
            </span>
        );
    }
    if (variant === 'expiring') {
        return (
            <span className="lot-due-warn">
                {formatDate(lot.dueDate)} · {expiration.label}
            </span>
        );
    }
    return <span>{formatDate(lot.dueDate)}</span>;
}

const MOVEMENT_TYPE_LABELS = {
    ENTRY: 'Entrada',
    EXIT: 'Salida',
    ADJUSTMENT: 'Ajuste',
};

// Las salidas llegan en positivo; los ajustes traen su propio signo.
function getSignedQuantity(movement) {
    return movement.movementType === 'EXIT' ? -movement.quantity : movement.quantity;
}

function useLotMovements(lotId) {
    const [state, setState] = useState({ movements: [], isLoading: true, error: null });

    useEffect(() => {
        let cancelled = false;

        Promise.all([getLotKardex(lotId), getSuppliers()])
            .then(([movements, suppliers]) => {
                if (cancelled) return;
                const supplierNameById = new Map(suppliers.map((s) => [String(s.supplierId), s.name]));
                setState({
                    movements: movements.map((m) => ({
                        ...m,
                        supplierName: m.supplierId ? supplierNameById.get(String(m.supplierId)) || '' : '',
                    })),
                    isLoading: false,
                    error: null,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setState({ movements: [], isLoading: false, error: 'No se pudieron cargar los movimientos.' });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [lotId]);

    return state;
}

function LotDetail({ lot, onBack, onSeeSeedLots }) {
    const { variant, expiration } = getLotVariant(lot);
    const initial = Number(lot.initialQuantity) || 0;
    const available = Number(lot.availableQuantity) || 0;
    const used = Math.max(initial - available, 0);
    const ratio = initial > 0 ? Math.min(available / initial, 1) : 0;
    const { movements, isLoading: movementsLoading, error: movementsError } = useLotMovements(lot.lotId);

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
                        <button type="button" className="seed-button secondary" onClick={() => onSeeSeedLots(lot.seedId)}>
                            Ver lotes de esta semilla
                        </button>
                    )}
                    <Link to={`/lots/${lot.lotId}/edit`} className="seed-button primary">
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
                                    <DueDate lot={lot} variant={variant} expiration={expiration} />
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
                                {movementsLoading && (
                                    <tr className="static">
                                        <td colSpan={5}>Cargando movimientos...</td>
                                    </tr>
                                )}
                                {movementsError && (
                                    <tr className="static">
                                        <td colSpan={5}>{movementsError}</td>
                                    </tr>
                                )}
                                {!movementsLoading && !movementsError && movements.length === 0 && (
                                    <tr className="static">
                                        <td colSpan={5}>Este lote no tiene movimientos registrados.</td>
                                    </tr>
                                )}
                                {movements.map((m) => {
                                    const signed = getSignedQuantity(m);
                                    return (
                                        <tr key={m.movementId} className="static">
                                            <td>{formatDate(m.movementDate)}</td>
                                            <td>{MOVEMENT_TYPE_LABELS[m.movementType] || m.movementType}</td>
                                            <td className={signed >= 0 ? 'lot-mv-in' : 'lot-mv-out'}>
                                                {signed >= 0 ? '+' : '−'}
                                                {formatQty(Math.abs(signed))}
                                            </td>
                                            <td>{m.reason || '—'}</td>
                                            <td>{m.supplierName || '—'}</td>
                                        </tr>
                                    );
                                })}
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

const STATUS_OPTIONS = Object.entries(LOT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

function getInitialFilter(location) {
    const seedId = location.state?.seedId;
    return seedId ? { mode: 'seedId', value: String(seedId) } : LOT_FILTER_INITIAL_STATE;
}

function LotListPage() {
    const location = useLocation();
    const [lots, setLots] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [isFetchingLots, setIsFetchingLots] = useState(true);
    const [lotsError, setLotsError] = useState(null);

    const [appliedFilter, setAppliedFilter] = useState(() => getInitialFilter(location));
    const [draftMode, setDraftMode] = useState(appliedFilter.mode);
    const [page, setPage] = useState(1);
    const [selectedLotId, setSelectedLotId] = useState(null);
    const topRef = useRef(null);

    useEffect(() => {
        Promise.all([getAllSeeds(), getLocations()])
            .then(([seedsData, locationsData]) => {
                setSeeds(seedsData);
                setLocations(locationsData);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el inventario de lotes.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        let cancelled = false;

        getLots(appliedFilter)
            .then((data) => {
                if (!cancelled) setLots(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setLots([]);
                    setLotsError('No se pudo cargar el inventario de lotes.');
                }
            })
            .finally(() => {
                if (!cancelled) setIsFetchingLots(false);
            });

        return () => {
            cancelled = true;
        };
    }, [appliedFilter]);

    const lotsWithNames = useMemo(() => {
        const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
        const locationNameById = new Map(locations.map((l) => [String(l.locationId), l.locationName]));
        return lots.map((lot) => ({
            ...lot,
            seedName: seedNameById.get(String(lot.seedId)) || '',
            locationName: locationNameById.get(String(lot.locationId)) || '',
        }));
    }, [lots, seeds, locations]);

    const { pageItems, totalPages, currentPage } = useMemo(
        () => paginateLots(lotsWithNames, page),
        [lotsWithNames, page]
    );

    useEffect(() => {
        window.scrollTo(0, 0);
        topRef.current?.scrollIntoView({ block: 'start' });
    }, [selectedLotId]);

    const hasAppliedFilter = appliedFilter.mode !== '';

    function applyFilter(next) {
        setPage(1);
        if (next.mode === appliedFilter.mode && next.value === appliedFilter.value) return;
        setIsFetchingLots(true);
        setLotsError(null);
        setAppliedFilter(next);
    }

    function handleModeChange(e) {
        setDraftMode(e.target.value);
        if (hasAppliedFilter) applyFilter(LOT_FILTER_INITIAL_STATE);
    }

    function handleValueChange(e) {
        const value = e.target.value;
        applyFilter(value ? { mode: draftMode, value } : LOT_FILTER_INITIAL_STATE);
    }

    function handleClearFilter() {
        setDraftMode('');
        applyFilter(LOT_FILTER_INITIAL_STATE);
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
        setDraftMode('seedId');
        applyFilter({ mode: 'seedId', value: String(seedId) });
        setSelectedLotId(null);
    }

    function getValueOptions(mode) {
        switch (mode) {
            case 'seedId':
                return {
                    label: 'Semilla',
                    placeholder: 'Selecciona una semilla',
                    options: seeds.map((seed) => ({ value: String(seed.seedId), label: seed.name })),
                };
            case 'locationId':
                return {
                    label: 'Ubicación',
                    placeholder: 'Selecciona una ubicación',
                    options: locations.map((l) => ({ value: String(l.locationId), label: l.locationName })),
                };
            case 'status':
                return { label: 'Estado', placeholder: 'Selecciona un estado', options: STATUS_OPTIONS };
            default:
                return null;
        }
    }

    function renderValueControl() {
        const config = getValueOptions(draftMode);
        if (!config) return null;

        return (
            <select
                className="lot-select"
                aria-label={config.label}
                value={appliedFilter.mode === draftMode ? appliedFilter.value : ''}
                onChange={handleValueChange}
            >
                <option value="">{config.placeholder}</option>
                {config.options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (isLoading) {
        return <div className="lot-list-loading">Cargando inventario de lotes...</div>;
    }

    if (loadError) {
        return <div className="lot-list-message error">{loadError}</div>;
    }

    if (!isFetchingLots && !lotsError && !hasAppliedFilter && lots.length === 0) {
        return (
            <div className="lot-list-empty">
                <p>No existen lotes registrados en el inventario.</p>
                <Link to="/lots/new" className="seed-button primary">
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
                    key={selectedLot.lotId}
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
                <Link to="/lots/new" className="seed-button primary">
                    + Registrar lote
                </Link>
            </div>

            <div className="lot-list-toolbar">
                <select
                    className="lot-select"
                    aria-label="Filtrar por"
                    value={draftMode}
                    onChange={handleModeChange}
                >
                    {LOT_FILTER_MODES.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {renderValueControl()}

                {(hasAppliedFilter || draftMode !== '') && (
                    <button type="button" className="seed-button secondary" onClick={handleClearFilter}>
                        Limpiar filtro
                    </button>
                )}
            </div>

            {isFetchingLots ? (
                <div className="lot-list-loading">Cargando lotes...</div>
            ) : lotsError ? (
                <div className="lot-list-message error">{lotsError}</div>
            ) : lots.length === 0 ? (
                <div className="lot-list-message">
                    No hay lotes con ese filtro.
                    <button type="button" className="lot-link" onClick={handleClearFilter}>
                        Limpiar filtro
                    </button>
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
                                const { variant, expiration } = getLotVariant(lot);
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
                                                    onClick={() => handleSeeSeedLots(lot.seedId)}
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
                                            <DueDate lot={lot} variant={variant} expiration={expiration} />
                                        </td>
                                        <td className="lot-qty">
                                            <b>{formatQty(available)}</b>{' '}
                                            <small>de {formatQty(initial)}</small>
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
                            className="seed-button secondary"
                            disabled={currentPage === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                        >
                            Anterior
                        </button>
                        <span>
                            {lots.length} {lots.length === 1 ? 'lote' : 'lotes'} · Página {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            className="seed-button secondary"
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
