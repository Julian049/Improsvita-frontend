import { formatQty } from '../../../utils/numberUtils';
import { getBedUsage } from './plantingListUtils';

export const PlantingBedStrip = ({ beds, plantings, selectedBedId, onSelect, onClear }) => (
    <section className="planting-section">
        <h3>
            Camas
            {selectedBedId && (
                <button type="button" onClick={onClear}>
                    Quitar filtro
                </button>
            )}
        </h3>

        <div className="planting-beds">
            {beds.map((bed) => {
                const { used, percent } = getBedUsage(bed, plantings);
                const level = percent >= 100 ? 'full' : percent >= 80 ? 'hi' : '';
                const isSelected = String(selectedBedId) === String(bed.bedId);

                return (
                    <button
                        key={bed.bedId}
                        type="button"
                        className={`planting-bed ${isSelected ? 'on' : ''} ${bed.active ? '' : 'off'}`}
                        aria-pressed={isSelected}
                        onClick={() => onSelect(bed.bedId)}
                    >
                        <b>
                            {bed.code}
                            <small>{Math.round(percent)}%</small>
                        </b>
                        <div className={`planting-fill ${level}`}>
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
