import { useEffect, useState } from 'react';
import { getLotKardex, updateLotStatus } from '../lotApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { getSowings } from '../../sowings/sowingApi.js';
import { getBeds } from '../../beds/bedApi.js';
import { getSowingStatusLabel } from '../../sowings/sowingStatus.js';
import { getEstimatedProduction } from '../../sowings/sowingsList/sowingListUtils.js';
import { LOT_STATUS_LABELS, getLotStatusLabel } from '../lotValidation.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import { formatDate } from '../../../utils/dateUtils.js';
import { formatQty } from '../../../utils/numberUtils.js';
import { getLotVariant } from './lotListUtils.js';

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

function useLotSowings(lotId) {
    const [state, setState] = useState({ sowings: [], isLoading: true, error: null });

    useEffect(() => {
        let cancelled = false;

        Promise.all([getSowings({ mode: 'lotId', value: lotId }), getBeds()])
            .then(([sowings, beds]) => {
                if (cancelled) return;
                const bedCodeById = new Map(beds.map((b) => [String(b.bedId), b.code]));
                setState({
                    sowings: sowings
                        // Con datos de prueba el filtro no lo aplica el backend.
                        .filter((s) => String(s.lotId) === String(lotId))
                        .map((s) => ({ ...s, bedCode: bedCodeById.get(String(s.bedId)) || '' })),
                    isLoading: false,
                    error: null,
                });
            })
            .catch(() => {
                if (!cancelled) setState({ sowings: [], isLoading: false, error: 'No se pudieron cargar las siembras.' });
            });

        return () => {
            cancelled = true;
        };
    }, [lotId]);

    return state;
}

// key={lot.status} en el padre reinicia la selección cuando el estado cambia.
function LotStatusBox({ lot, onLotChange }) {
    const [status, setStatus] = useState(lot.status);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const updated = await updateLotStatus(lot.lotId, status);
            onLotChange?.({ ...lot, status: updated.status });
        } catch (err) {
            setMessage(getApiErrorMessage(err, 'No se pudo cambiar el estado del lote.'));
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form className="lot-box lot-status-box" onSubmit={handleSubmit}>
            <h3>Estado del lote</h3>
            <select className="lot-select" aria-label="Nuevo estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(LOT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            <button type="submit" className="seed-button primary" disabled={isSaving || status === lot.status}>
                {isSaving ? 'Guardando...' : 'Cambiar estado'}
            </button>
            {message && (
                <small className="lot-status-error" role="alert">
                    {message}
                </small>
            )}
        </form>
    );
}

export function LotDetail({ lot, onBack, onSeeSeedLots, onEdit, onLotChange, backLabel = 'Lotes' }) {
    const variant = getLotVariant(lot);
    const initial = Number(lot.initialQuantity) || 0;
    const available = Number(lot.availableQuantity) || 0;
    const used = Math.max(initial - available, 0);
    const ratio = initial > 0 ? Math.min(available / initial, 1) : 0;
    const { movements, isLoading: movementsLoading, error: movementsError } = useLotMovements(lot.lotId);
    const { sowings, isLoading: sowingsLoading, error: sowingsError } = useLotSowings(lot.lotId);

    return (
        <>
            <div className="lot-crumb">
                <button type="button" className="lot-link" onClick={onBack}>
                    ← {backLabel}
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
                    <button type="button" className="seed-button secondary" onClick={() => onEdit(lot.lotId)}>
                        Editar lote
                    </button>
                    {lot.seedId && (
                        <button type="button" className="seed-button secondary" onClick={() => onSeeSeedLots(lot.seedId)}>
                            Ver lotes de esta semilla
                        </button>
                    )}
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

                    <section className="lot-box">
                        <h3>Siembras con este lote</h3>
                        <div className="lot-table-wrapper flat">
                            <table className="lot-table">
                                <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Cama</th>
                                    <th>Sembradas</th>
                                    <th>Prod. estimada</th>
                                    <th>Estado</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sowingsLoading && (
                                    <tr className="static">
                                        <td colSpan={5}>Cargando siembras...</td>
                                    </tr>
                                )}
                                {sowingsError && (
                                    <tr className="static">
                                        <td colSpan={5}>{sowingsError}</td>
                                    </tr>
                                )}
                                {!sowingsLoading && !sowingsError && sowings.length === 0 && (
                                    <tr className="static">
                                        <td colSpan={5}>Este lote aún no se ha sembrado.</td>
                                    </tr>
                                )}
                                {sowings.map((s) => {
                                    const estimated = getEstimatedProduction({ ...s, germinationPercentage: lot.germinationPercentage });
                                    return (
                                        <tr key={s.sowingId} className="static">
                                            <td>{formatDate(s.sowingDate)}</td>
                                            <td>{s.bedCode || '—'}</td>
                                            <td>{formatQty(s.quantitySown)}</td>
                                            <td>{estimated == null ? '—' : formatQty(estimated)}</td>
                                            <td>{getSowingStatusLabel(s.status)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="lot-col-main">
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

                <LotStatusBox key={lot.status} lot={lot} onLotChange={onLotChange} />
                </div>
            </div>
        </>
    );
}
