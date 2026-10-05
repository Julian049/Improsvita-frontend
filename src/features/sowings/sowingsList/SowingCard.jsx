import { formatDate } from '../../../utils/dateUtils';
import { formatQty } from '../../../utils/numberUtils';
import { getGerminationPercent, getGerminationTiming } from './sowingListUtils';

export const SowingCard = ({ sowing, onSelect }) => {
    const percent = getGerminationPercent(sowing);
    const timing = getGerminationTiming(sowing);

    function handleClick(e) {
        if (e.target.closest('a, button')) return;
        onSelect(sowing.sowingId);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && e.target.tagName === 'ARTICLE') {
            onSelect(sowing.sowingId);
        }
    }

    return (
        <article
            tabIndex={0}
            className="sowing-card"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div className="sowing-r1">
                <div>
                    <h4>{sowing.seedName || '—'}</h4>
                    <small>Lote {sowing.lotNumber || '—'}</small>
                </div>
                <span className="sowing-tag">Cama {sowing.bedCode || '—'}</span>
            </div>

            <div className="sowing-r2">
                <div className="sowing-ring" style={{ '--p': percent }}>
                    <b>{percent}%</b>
                </div>
                <div className="sowing-nums">
                    <div>
                        <span>Sembradas</span>
                        <b>{formatQty(sowing.quantitySown)}</b>
                    </div>
                    <div>
                        <span>Germinadas</span>
                        <b>{formatQty(sowing.germinatedQuantity)}</b>
                    </div>
                </div>
            </div>

            <div className="sowing-r3">
                <span>
                    Sembrada {formatDate(sowing.sowingDate)}
                    {!timing && ` · germ. ${formatDate(sowing.expectedGerminationDate)}`}
                </span>
                {timing && <span className={`sowing-when ${timing.level}`}>{timing.label}</span>}
            </div>

            {sowing.notes && <p className="sowing-note">“{sowing.notes}”</p>}
        </article>
    );
};
