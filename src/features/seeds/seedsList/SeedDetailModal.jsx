import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/dateUtils';
import { daysUntil } from '../../../utils/daysUntil';
import { formatQty } from '../../../utils/numberUtils';

function getDueNote(dateValue) {
    const days = daysUntil(dateValue);
    if (days === null) return '';
    if (days < 0) return ' · vencido';
    return ` · ${days} ${days === 1 ? 'día restante' : 'días restantes'}`;
}

export const SeedDetailModal = ({ seed, typeLabel, lots, stock, lotsLoaded, onSeeLots, onClose }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (seed && !dialog.open) dialog.showModal();
        if (!seed && dialog.open) dialog.close();
    }, [seed]);

    return (
        <dialog
            ref={dialogRef}
            className={`seed-dialog ${seed && !seed.active ? 'off' : ''}`}
            aria-labelledby="seed-dialog-name"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {seed && (
                <>
                    <div className="seed-dialog-head">
                        <div>
                            <h2 id="seed-dialog-name">{seed.name}</h2>
                            <div className="seed-tags">
                                <span className="seed-type">{typeLabel}</span>
                                <span className="seed-state">{seed.active ? 'Activa' : 'Desactivada'}</span>
                            </div>
                        </div>
                        <button type="button" className="seed-x" aria-label="Cerrar" onClick={onClose}>
                            ✕
                        </button>
                    </div>

                    <div className="seed-dialog-body">
                        <p>{seed.description || 'Sin descripción.'}</p>

                        <div className="seed-dk">
                            <div>
                                <span>Stock disponible</span>
                                {lotsLoaded ? (
                                    <b className={stock ? '' : 'seed-out'}>
                                        {stock ? formatQty(stock, 'uds') : 'Agotado'}
                                    </b>
                                ) : (
                                    <b>—</b>
                                )}
                            </div>
                            <div>
                                <span>Lotes</span>
                                {lotsLoaded ? (
                                    <button type="button" className="seed-link" onClick={() => onSeeLots(seed.seedId)}>
                                        {lots.length} {lots.length === 1 ? 'lote' : 'lotes'} · ver →
                                    </button>
                                ) : (
                                    <b>—</b>
                                )}
                            </div>
                        </div>

                        {lotsLoaded && (
                            <section>
                                <div className="seed-sh">
                                    <h4>Lotes</h4>
                                    <small>
                                        {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}
                                    </small>
                                </div>
                                {lots.length === 0 ? (
                                    <p>No hay lotes asociados a esta semilla.</p>
                                ) : (
                                    <ul className="seed-hl">
                                        {lots.map((lot) => (
                                            <li key={lot.lotId}>
                                                <i />
                                                <div>
                                                    <b>Lote {lot.lotNumber}</b>
                                                    <small>
                                                        Vence {formatDate(lot.dueDate)}
                                                        {getDueNote(lot.dueDate)}
                                                    </small>
                                                </div>
                                                <b className="seed-hl-qty">{formatQty(lot.availableQuantity, 'uds')}</b>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}

                        <section>
                            <div className="seed-sh">
                                <h4>Proveedores</h4>
                                <small>
                                    {seed.supplierNames.length}{' '}
                                    {seed.supplierNames.length === 1 ? 'proveedor' : 'proveedores'}
                                </small>
                            </div>
                            {seed.supplierNames.length === 0 ? (
                                <p>Esta semilla no tiene proveedores asociados.</p>
                            ) : (
                                <ul className="seed-hl">
                                    {seed.supplierNames.map((name) => (
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
                        <button type="button" className="seed-gh" onClick={onClose}>
                            Cerrar
                        </button>
                        <div className="seed-dacts">
                            <Link to={`/seeds/${seed.seedId}/edit`} className="seed-gh">
                                Editar
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </dialog>
    );
};
