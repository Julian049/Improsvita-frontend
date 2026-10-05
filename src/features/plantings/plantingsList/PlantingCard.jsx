import { formatDate } from '../../../utils/dateUtils';
import { formatQty } from '../../../utils/numberUtils';
import { getGerminationPercent, getGerminationTiming } from './plantingListUtils';

export const PlantingCard = ({ planting, onSelect }) => {
    const percent = getGerminationPercent(planting);
    const timing = getGerminationTiming(planting);

    function handleClick(e) {
        if (e.target.closest('a, button')) return;
        onSelect(planting.plantingId);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && e.target.tagName === 'ARTICLE') {
            onSelect(planting.plantingId);
        }
    }

    return (
        <article
            tabIndex={0}
            className="planting-card"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div className="planting-r1">
                <div>
                    <h4>{planting.seedName || '—'}</h4>
                    <small>Lote {planting.lotNumber || '—'}</small>
                </div>
                <span className="planting-tag">Cama {planting.bedCode || '—'}</span>
            </div>

            <div className="planting-r2">
                <div className="planting-ring" style={{ '--p': percent }}>
                    <b>{percent}%</b>
                </div>
                <div className="planting-nums">
                    <div>
                        <span>Sembradas</span>
                        <b>{formatQty(planting.quantitySown)}</b>
                    </div>
                    <div>
                        <span>Germinadas</span>
                        <b>{formatQty(planting.germinatedQuantity)}</b>
                    </div>
                </div>
            </div>

            <div className="planting-r3">
                <span>
                    Sembrada {formatDate(planting.sowingDate)}
                    {!timing && ` · germ. ${formatDate(planting.expectedGerminationDate)}`}
                </span>
                {timing && <span className={`planting-when ${timing.level}`}>{timing.label}</span>}
            </div>

            {planting.notes && <p className="planting-note">“{planting.notes}”</p>}
        </article>
    );
};
