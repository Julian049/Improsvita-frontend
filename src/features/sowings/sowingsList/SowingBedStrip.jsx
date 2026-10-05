import { formatQty } from '../../../utils/numberUtils';
import { getBedUsage } from './sowingListUtils';

export const SowingBedStrip = ({ beds, sowings, selectedBedId, onSelect, onClear }) => (
    <section className="sowing-section">
        <h3>
            Camas
            {selectedBedId && (
                <button type="button" onClick={onClear}>
                    Quitar filtro
                </button>
            )}
        </h3>

        <div className="sowing-beds">
            {beds.map((bed) => {
                const { used, percent } = getBedUsage(bed, sowings);
                const level = percent >= 100 ? 'full' : percent >= 80 ? 'hi' : '';
                const isSelected = String(selectedBedId) === String(bed.bedId);

                return (
                    <button
                        key={bed.bedId}
                        type="button"
                        className={`sowing-bed ${isSelected ? 'on' : ''} ${bed.active ? '' : 'off'}`}
                        aria-pressed={isSelected}
                        onClick={() => onSelect(bed.bedId)}
                    >
                        <b>
                            {bed.code}
                            <small>{Math.round(percent)}%</small>
                        </b>
                        <div className={`sowing-fill ${level}`}>
                            <i style={{ width: `${percent}%` }} />
                        </div>
                        <small>
                            {formatQty(used)} / {formatQty(bed.maxCapacity)} uds
                            {bed.active ? '' : ' · inactiva'}
                        </small>
                    </button>
                );
            })}
        </div>
    </section>
);
