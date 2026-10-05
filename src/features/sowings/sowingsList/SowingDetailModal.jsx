import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../../../utils/dateUtils';
import { formatQty } from '../../../utils/numberUtils';
import {
    SOWING_STATUS,
    SOWING_STATUS_FLOW,
    getNextStatus,
    getSowingStatusLabel,
    getStatusIndex,
    isTerminalStatus,
} from '../sowingStatus';
import { getGerminationPercent } from './sowingListUtils';

function GerminationForm({ sowing, isUpdating, onSave }) {
    const [value, setValue] = useState(String(sowing.germinatedQuantity));
    const [error, setError] = useState(null);

    function handleSubmit(e) {
        e.preventDefault();
        const quantity = Number(value);
        if (value.trim() === '' || Number.isNaN(quantity) || quantity < 0) {
            setError('Ingresa una cantidad válida (0 o mayor).');
            return;
        }
        if (quantity > sowing.quantitySown) {
            setError(`No puede superar lo sembrado (${formatQty(sowing.quantitySown)}).`);
            return;
        }
        setError(null);
        onSave(sowing, quantity);
    }

    return (
        <form className="sowing-germination" onSubmit={handleSubmit} noValidate>
            <label>
                <span className="sowing-hint">Semillas germinadas</span>
                <input
                    type="number"
                    min="0"
                    max={sowing.quantitySown}
                    step="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    aria-invalid={Boolean(error)}
                />
            </label>
            <button type="submit" className="sowing-gh" disabled={isUpdating}>
                Guardar germinación
            </button>
            {error && (
                <small className="sowing-inline-error" role="alert">
                    {error}
                </small>
            )}
        </form>
    );
}

export const SowingDetailModal = ({
                                        sowing,
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
        if (sowing && !dialog.open) dialog.showModal();
        if (!sowing && dialog.open) dialog.close();
    }, [sowing]);

    const nextStatus = sowing ? getNextStatus(sowing.status) : null;
    const statusIndex = sowing ? getStatusIndex(sowing.status) : -1;
    const percent = sowing ? getGerminationPercent(sowing) : 0;
    const isTerminal = sowing ? isTerminalStatus(sowing.status) : false;

    return (
        <dialog
            ref={dialogRef}
            className={`sowing-dialog sowing-status-${(sowing?.status || '').toLowerCase()}`}
            aria-labelledby="sowing-dialog-name"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {sowing && (
                <>
                    <div className="sowing-dialog-head">
                        <div>
                            <h2 id="sowing-dialog-name">{sowing.seedName || '—'}</h2>
                            <div className="sowing-tags">
                                <span className="sowing-tag">{getSowingStatusLabel(sowing.status)}</span>
                            </div>
                        </div>
                        <button type="button" className="sowing-x" aria-label="Cerrar" onClick={onClose}>
                            ✕
                        </button>
                    </div>

                    <div className="sowing-dialog-body">
                        <div className="sowing-hero">
                            <div className="sowing-ring large" style={{ '--p': percent }}>
                                <b>{percent}%</b>
                            </div>
                            <div className="sowing-dk">
                                <div>
                                    <span>Sembradas</span>
                                    <b>{formatQty(sowing.quantitySown)}</b>
                                </div>
                                <div>
                                    <span>Germinadas</span>
                                    <b>{formatQty(sowing.germinatedQuantity)}</b>
                                </div>
                                <div>
                                    <span>Lote</span>
                                    <b>Lote {sowing.lotNumber || '—'}</b>
                                </div>
                                <div>
                                    <span>Cama</span>
                                    <b>{sowing.bedCode || '—'}</b>
                                </div>
                                <div>
                                    <span>Fecha de siembra</span>
                                    <b>{formatDate(sowing.sowingDate)}</b>
                                </div>
                                <div>
                                    <span>Germinación esperada</span>
                                    <b>{formatDate(sowing.expectedGerminationDate)}</b>
                                </div>
                            </div>
                        </div>

                        {statusIndex !== -1 && (
                            <ol className="sowing-trail" aria-label="Progreso de la siembra">
                                {SOWING_STATUS_FLOW.map((status, index) => (
                                    <li
                                        key={status}
                                        className={index <= statusIndex ? 'done' : ''}
                                        aria-current={index === statusIndex ? 'step' : undefined}
                                    >
                                        {getSowingStatusLabel(status)}
                                    </li>
                                ))}
                            </ol>
                        )}

                        <GerminationForm
                            key={`${sowing.sowingId}-${sowing.germinatedQuantity}`}
                            sowing={sowing}
                            isUpdating={isUpdating}
                            onSave={onSaveGermination}
                        />

                        <div>
                            <span className="sowing-hint">Notas</span>
                            <p className="sowing-dialog-note">{sowing.notes || 'Sin notas.'}</p>
                        </div>

                        {errorMessage && (
                            <div className="sowing-inline-error" role="alert">
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    <div className="sowing-dialog-foot">
                        <button type="button" className="sowing-gh" onClick={onClose}>
                            Cerrar
                        </button>
                        {!isTerminal && (
                            <div className="sowing-dacts">
                                <button
                                    type="button"
                                    className="sowing-gh danger"
                                    disabled={isUpdating}
                                    onClick={() => onRequestClose(sowing, SOWING_STATUS.CANCELLED)}
                                >
                                    Cancelar siembra
                                </button>
                                <button
                                    type="button"
                                    className="sowing-gh danger"
                                    disabled={isUpdating}
                                    onClick={() => onRequestClose(sowing, SOWING_STATUS.FAILED)}
                                >
                                    Marcar fallida
                                </button>
                                {nextStatus && (
                                    <button
                                        type="button"
                                        className="sowing-btn"
                                        disabled={isUpdating}
                                        onClick={() => onAdvance(sowing)}
                                    >
                                        {isUpdating
                                            ? 'Guardando...'
                                            : `Avanzar a ${getSowingStatusLabel(nextStatus)}`}
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
