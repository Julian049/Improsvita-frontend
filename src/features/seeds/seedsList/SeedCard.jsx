import { Link } from 'react-router-dom';
import { formatQty } from '../../../utils/numberUtils';

export const SeedCard = ({ seed, typeLabel, stock, lotCount, lotsLoaded, onSelect, onDelete }) => {
    function handleClick(e) {
        if (e.target.closest('a, button')) return;
        onSelect(seed.seedId);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && e.target.tagName === 'ARTICLE') {
            onSelect(seed.seedId);
        }
    }

    return (
        <article
            tabIndex={0}
            className={`seed-card ${seed.active ? '' : 'off'}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div className="seed-card-row">
                <h3>{seed.name}</h3>
                <span className="seed-type">{typeLabel}</span>
            </div>

            <span className="seed-state">{seed.active ? 'Activa' : 'Desactivada'}</span>

            <p className="seed-desc">{seed.description || '—'}</p>

            <div className="seed-meta">
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
                    <span>Lotes · Proveedores</span>
                    <b>
                        {lotsLoaded ? lotCount : '—'} · {seed.supplierNames.length}
                    </b>
                </div>
            </div>

            <div className="seed-foot">
                <div className="seed-acts">
                    <Link to={`/seeds/${seed.seedId}/edit`} className="seed-link">
                        Editar
                    </Link>
                    <button type="button" className="seed-link danger" onClick={() => onDelete(seed)}>
                        Eliminar
                    </button>
                </div>
            </div>
        </article>
    );
};
