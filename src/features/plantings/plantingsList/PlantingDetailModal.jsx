import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../../../utils/dateUtils';
import { formatQty } from '../../../utils/numberUtils';
import {
    PLANTING_STATUS,
    PLANTING_STATUS_FLOW,
    getNextStatus,
    getPlantingStatusLabel,
    getStatusIndex,
    isTerminalStatus,
} from '../plantingStatus';
import { getGerminationPercent } from './plantingListUtils';

function GerminationForm({ planting, isUpdating, onSave }) {
    const [value, setValue] = useState(String(planting.germinatedQuantity));
    const [error, setError] = useState(null);

    function handleSubmit(e) {
        e.preventDefault();
        const quantity = Number(value);
        if (value.trim() === '' || Number.isNaN(quantity) || quantity < 0) {
            setError('Ingresa una cantidad válida (0 o mayor).');
            return;
        }
        if (quantity > planting.quantitySown) {
            setError(`No puede superar lo sembrado (${formatQty(planting.quantitySown)}).`);
            return;
        }
        setError(null);
        onSave(planting, quantity);
    }

    return (
        <form className="planting-germination" onSubmit={handleSubmit} noValidate>
            <label>
                <span className="planting-hint">Semillas germinadas</span>
                <input
                    type="number"
                    min="0"
                    max={planting.quantitySown}
                    step="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    aria-invalid={Boolean(error)}
                />
            </label>
            <button type="submit" className="planting-gh" disabled={isUpdating}>
                Guardar germinación
            </button>
            {error && (
                <small className="planting-inline-error" role="alert">
                    {error}
                </small>
            )}
        </form>
    );
}

export const PlantingDetailModal = ({
                                        planting,
                                        isUpdating,
                                        errorMessage,
                                        onAdvance,
                                        onClose,
                                        onRequestClose,
                                        onSaveGermination,
                                    }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (planting && !dialog.open) dialog.showModal();
        if (!planting && dialog.open) dialog.close();
    }, [planting]);

    const nextStatus = planting ? getNextStatus(planting.status) : null;
    const statusIndex = planting ? getStatusIndex(planting.status) : -1;
    const percent = planting ? getGerminationPercent(planting) : 0;
    const isTerminal = planting ? isTerminalStatus(planting.status) : false;

    return (
        <dialog
            ref={dialogRef}
            className={`planting-dialog planting-status-${(planting?.status || '').toLowerCase()}`}
            aria-labelledby="planting-dialog-name"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {planting && (
                <>
                    <div className="planting-dialog-head">
                        <div>
                            <h2 id="planting-dialog-name">{planting.seedName || '—'}</h2>
                            <div className="planting-tags">
                                <span className="planting-tag">{getPlantingStatusLabel(planting.status)}</span>
                            </div>
                        </div>
                        <button type="button" className="planting-x" aria-label="Cerrar" onClick={onClose}>
                            ✕
                        </button>
                    </div>

                    <div className="planting-dialog-body">
                        <div className="planting-hero">
                            <div className="planting-ring large" style={{ '--p': percent }}>
                                <b>{percent}%</b>
                            </div>
                            <div className="planting-dk">
                                <div>
                                    <span>Sembradas</span>
                                    <b>{formatQty(planting.quantitySown)}</b>
                                </div>
                                <div>
                                    <span>Germinadas</span>
                                    <b>{formatQty(planting.germinatedQuantity)}</b>
                                </div>
                                <div>
                                    <span>Lote</span>
                                    <b>Lote {planting.lotNumber || '—'}</b>
                                </div>
                                <div>
                                    <span>Cama</span>
                                    <b>{planting.bedCode || '—'}</b>
                                </div>
                                <div>
                                    <span>Fecha de siembra</span>
                                    <b>{formatDate(planting.sowingDate)}</b>
                                </div>
                                <div>
                                    <span>Germinación esperada</span>
                                    <b>{formatDate(planting.expectedGerminationDate)}</b>
                                </div>
                            </div>
                        </div>

                        {statusIndex !== -1 && (
                            <ol className="planting-trail" aria-label="Progreso de la siembra">
                                {PLANTING_STATUS_FLOW.map((status, index) => (
                                    <li
                                        key={status}
                                        className={index <= statusIndex ? 'done' : ''}
                                        aria-current={index === statusIndex ? 'step' : undefined}
                                    >
                                        {getPlantingStatusLabel(status)}
                                    </li>
                                ))}
                            </ol>
                        )}

                        <GerminationForm
                            key={`${planting.plantingId}-${planting.germinatedQuantity}`}
                            planting={planting}
                            isUpdating={isUpdating}
                            onSave={onSaveGermination}
                        />

                        <div>
                            <span className="planting-hint">Notas</span>
                            <p className="planting-dialog-note">{planting.notes || 'Sin notas.'}</p>
                        </div>

                        {errorMessage && (
                            <div className="planting-inline-error" role="alert">
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    <div className="planting-dialog-foot">
                        <button type="button" className="planting-gh" onClick={onClose}>
                            Cerrar
                        </button>
                        {!isTerminal && (
                            <div className="planting-dacts">
                                <button
                                    type="button"
                                    className="planting-gh danger"
                                    disabled={isUpdating}
                                    onClick={() => onRequestClose(planting, PLANTING_STATUS.CANCELLED)}
                                >
                                    Cancelar siembra
                                </button>
                                <button
                                    type="button"
                                    className="planting-gh danger"
                                    disabled={isUpdating}
                                    onClick={() => onRequestClose(planting, PLANTING_STATUS.FAILED)}
                                >
                                    Marcar fallida
                                </button>
                                {nextStatus && (
                                    <button
                                        type="button"
                                        className="planting-btn"
                                        disabled={isUpdating}
                                        onClick={() => onAdvance(planting)}
                                    >
                                        {isUpdating
                                            ? 'Guardando...'
                                            : `Avanzar a ${getPlantingStatusLabel(nextStatus)}`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </dialog>
    );
};
