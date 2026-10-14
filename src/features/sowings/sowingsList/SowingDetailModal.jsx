import { useEffect, useRef } from 'react';
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
import { getEstimatedProduction } from './sowingListUtils';

export const SowingDetailModal = ({
                                        sowing,
                                        isUpdating,
                                        errorMessage,
                                        onAdvance,
                                        onClose,
                                        onRequestClose,
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
    const estimated = sowing ? getEstimatedProduction(sowing) : null;
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
                            <div className="sowing-ring large" style={{ '--p': sowing.germinationPercentage ?? 0 }}>
                                <b>{sowing.germinationPercentage == null ? '—' : `${sowing.germinationPercentage}%`}</b>
                            </div>
                            <div className="sowing-dk">
                                <div>
                                    <span>Sembradas</span>
                                    <b>{formatQty(sowing.quantitySown)}</b>
                                </div>
                                <div>
                                    <span>Producción estimada</span>
                                    <b>{estimated == null ? 'Sin % de germinación' : `${formatQty(estimated)} plántulas`}</b>
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
