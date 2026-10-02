import { useEffect, useRef } from 'react';
import { formatDate } from '../../../utils/dateUtils';
import { formatQty } from '../../../utils/numberUtils';
import {
    PLANTING_STATUS_FLOW,
    getNextStatus,
    getPlantingStatusLabel,
    getStatusIndex,
} from '../plantingStatus';
import { getGerminationPercent } from './plantingListUtils';

export const PlantingDetailModal = ({
                                        planting,
                                        isUpdating,
                                        errorMessage,
                                        onAdvance,
                                        onToggleActive,
                                        onClose,
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
                                {!planting.active && <span className="planting-off-label">● Desactivada</span>}
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

                        <ol className="planting-trail" aria-label="Progreso de la siembra">
                            {PLANTING_STATUS_FLOW.map((step, index) => (
                                <li
                                    key={step.value}
                                    className={index <= statusIndex ? 'done' : ''}
                                    aria-current={index === statusIndex ? 'step' : undefined}
                                >
                                    {step.label}
                                </li>
                            ))}
                        </ol>

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
                        <div className="planting-dacts">
                            <button
                                type="button"
                                className={`planting-gh ${planting.active ? 'danger' : ''}`}
                                disabled={isUpdating}
                                onClick={() => onToggleActive(planting)}
                            >
                                {planting.active ? 'Desactivar' : 'Activar'}
                            </button>
                            {nextStatus && (
                                <button
                                    type="button"
                                    className="planting-btn"
                                    disabled={isUpdating || !planting.active}
                                    title={
                                        planting.active
                                            ? undefined
                                            : 'Active la siembra para cambiar su estado'
                                    }
                                    onClick={() => onAdvance(planting)}
                                >
                                    {isUpdating
                                        ? 'Guardando...'
                                        : `Avanzar a ${getPlantingStatusLabel(nextStatus)}`}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </dialog>
    );
};
