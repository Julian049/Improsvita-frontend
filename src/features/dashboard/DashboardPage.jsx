import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSeeds } from '../seeds/seedApi.js';
import { getAllLots } from '../lots/lotApi.js';
import { getAllSowings } from '../sowings/sowingApi.js';
import { getBeds } from '../beds/bedApi.js';
import { formatQty } from '../../utils/numberUtils.js';
import { getDashboardData } from './dashboardUtils.js';
import './Dashboard.css';

function Stat({ label, value, hint }) {
    return (
        <div className="dash-stat">
            <span>{label}</span>
            <b>{value}</b>
            {hint && <small>{hint}</small>}
        </div>
    );
}

function DashboardPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([getAllSeeds(), getAllLots(), getAllSowings(), getBeds()])
            .then(([seeds, lots, sowings, beds]) => setData(getDashboardData({ seeds, lots, sowings, beds })))
            .catch(() => setError('No se pudo cargar el resumen.'));
    }, []);

    function handleTrace(e) {
        e.preventDefault();
        if (code.trim()) navigate(`/lots/trace?codigo=${encodeURIComponent(code.trim())}`);
    }

    return (
        <div className="dash-page">
            <div className="dash-head">
                <h1>Panel principal</h1>
                <div className="dash-actions">
                    <Link to="/lots/new" className="seed-button secondary">
                        + Registrar lote
                    </Link>
                    <Link to="/sowings/new" className="seed-button primary">
                        + Registrar siembra
                    </Link>
                </div>
            </div>

            <form className="dash-box dash-trace" onSubmit={handleTrace}>
                <div>
                    <h3>Trazabilidad de un lote</h3>
                    <p>Busca por código para ver su origen, movimientos, siembras y cambiar su estado.</p>
                </div>
                <div className="dash-trace-row">
                    <input
                        aria-label="Código de lote"
                        placeholder="Código de lote, ej. 101"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button type="submit" className="seed-button primary">
                        Buscar
                    </button>
                </div>
            </form>

            {error && <div className="dash-box dash-error">{error}</div>}
            {!data && !error && <div className="dash-box dash-muted">Cargando resumen...</div>}

            {data && (
                <>
                    <div className="dash-stats">
                        <Stat label="Semillas activas" value={formatQty(data.activeSeeds)} />
                        <Stat
                            label="Stock disponible"
                            value={`${formatQty(data.availableStock)} uds`}
                            hint={`en ${data.availableLotCount} ${data.availableLotCount === 1 ? 'lote' : 'lotes'}`}
                        />
                        <Stat label="Siembras en curso" value={formatQty(data.openSowingCount)} hint="planificadas o en progreso" />
                        <Stat
                            label="Producción estimada"
                            value={`${formatQty(data.estimatedProduction)} plántulas`}
                            hint={
                                data.sowingsWithoutPercent > 0
                                    ? `${data.sowingsWithoutPercent} siembra(s) sin % de germinación no suman`
                                    : 'de las siembras en curso'
                            }
                        />
                    </div>

                    <div className="dash-cols">
                        <section className="dash-box">
                            <h3>Siembras que requieren atención</h3>
                            {data.attention.length === 0 ? (
                                <p className="dash-muted">Ninguna siembra retrasada ni por germinar en los próximos días.</p>
                            ) : (
                                <ul className="dash-list">
                                    {data.attention.map((s) => (
                                        <li key={s.sowingId}>
                                            <div>
                                                <b>{s.seedName || '—'}</b>
                                                <small>
                                                    Lote {s.lotNumber || '—'} · Cama {s.bedCode || '—'}
                                                </small>
                                            </div>
                                            <span className={`dash-tag ${s.timing.level}`}>{s.timing.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link to="/sowings" className="dash-more">
                                Ver siembras →
                            </Link>
                        </section>

                        <section className="dash-box">
                            <h3>Lotes con poco stock</h3>
                            {data.lowStockLots.length === 0 ? (
                                <p className="dash-muted">Ningún lote por debajo del 30% de su cantidad inicial.</p>
                            ) : (
                                <ul className="dash-list">
                                    {data.lowStockLots.map((l) => (
                                        <li key={l.lotId}>
                                            <div>
                                                <Link to={`/lots/trace?codigo=${encodeURIComponent(l.lotNumber)}`}>
                                                    Lote {l.lotNumber}
                                                </Link>
                                                <small>{l.seedName || '—'}</small>
                                            </div>
                                            <span className="dash-tag warn">
                                                {formatQty(l.availableQuantity)} de {formatQty(l.initialQuantity)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link to="/lots" className="dash-more">
                                Ver lotes →
                            </Link>
                        </section>
                    </div>

                    <section className="dash-box">
                        <h3>Ocupación de camas</h3>
                        {data.bedUsage.length === 0 ? (
                            <p className="dash-muted">No hay camas activas.</p>
                        ) : (
                            <ul className="dash-beds">
                                {data.bedUsage.map((b) => (
                                    <li key={b.bedId}>
                                        <span>{b.code}</span>
                                        <div className={`dash-meter ${b.percent >= 100 ? 'full' : b.percent >= 80 ? 'hi' : ''}`}>
                                            <i style={{ width: `${b.percent}%` }} />
                                        </div>
                                        <small>
                                            {b.maxCapacity > 0
                                                ? `${Math.round(b.percent)}% · ${formatQty(b.used)} / ${formatQty(b.maxCapacity)}`
                                                : `${formatQty(b.used)} uds · sin capacidad`}
                                        </small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default DashboardPage;
