import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils.js';
import { formatQty } from '../../utils/numberUtils.js';
import { useDashboardData } from './useDashboardData.js';
import BiDashboard from './BiDashboard.jsx';
import './Dashboard.css';

const clockFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

const formatMoney = (value) => `$ ${formatQty(value)}`;

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
    const { data, commercial, isRefreshing, lastUpdated, error, refresh } = useDashboardData();

    function handleTrace(e) {
        e.preventDefault();
        if (code.trim()) navigate(`/lots/trace?codigo=${encodeURIComponent(code.trim())}`);
    }

    return (
        <div className="dash-page">
            <div className="dash-head">
                <div>
                    <h1>Panel principal</h1>
                    <p className="page-subtitle">
                        Estado del inventario, siembras y actividad comercial del vivero.
                    </p>
                </div>
                <div className="dash-actions">
                    <Link to="/lots/new" className="seed-button secondary">
                        + Registrar lote
                    </Link>
                    <Link to="/sowings/new" className="seed-button primary">
                        + Registrar siembra
                    </Link>
                </div>
            </div>

            <div className="dash-live" role="status" aria-live="polite">
                <span className={`dash-live-dot ${isRefreshing ? 'busy' : ''}`} aria-hidden="true" />
                <div className="dash-live-copy">
                    <b>Panel en vivo</b>
                    <span>
                        {lastUpdated
                            ? `Actualizado a las ${clockFormatter.format(lastUpdated)} · cada 60 s`
                            : 'Obteniendo datos...'}
                    </span>
                </div>
                {error && data && <span className="dash-live-warning">{error}</span>}
                <button
                    type="button"
                    className="seed-button secondary dash-live-button"
                    onClick={refresh}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? 'Actualizando...' : 'Actualizar ahora'}
                </button>
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

            {error && !data && <div className="dash-box dash-error">{error}</div>}
            {!data && !error && <div className="dash-box dash-muted">Cargando resumen...</div>}

            {commercial && (
                <section className="dash-section" aria-label="Actividad comercial">
                    <div className="dash-section-head">
                        <div>
                            <h2>Actividad comercial</h2>
                            <p>Ventas y reservas actualizadas automáticamente.</p>
                        </div>
                        <Link to="/history" className="dash-more">
                            Ver historial
                        </Link>
                    </div>
                    <div className="dash-stats dash-stats-commercial">
                        <Stat
                            label="Ventas hoy"
                            value={formatQty(commercial.salesToday)}
                            hint={`${formatQty(commercial.unitsToday)} plántulas`}
                        />
                        <Stat
                            label="Ingresos hoy"
                            value={formatMoney(commercial.revenueToday)}
                            hint="ventas activas"
                        />
                        <Stat
                            label="Ingresos del mes"
                            value={formatMoney(commercial.revenueMonth)}
                            hint={`${formatQty(commercial.salesMonth)} ventas`}
                        />
                        <Stat
                            label="Reservas pendientes"
                            value={formatQty(commercial.pendingReservations)}
                            hint="por confirmar o entregar"
                        />
                        <Stat
                            label="Última venta"
                            value={commercial.lastSale ? formatMoney(commercial.lastSale.total) : '—'}
                            hint={
                                commercial.lastSale
                                    ? `${formatQty(commercial.lastSale.quantity)} plántulas · ${formatDate(commercial.lastSale.saleDate)}`
                                    : 'Sin ventas este mes'
                            }
                        />
                    </div>
                </section>
            )}

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
                                data.sowingsWithoutProduction > 0
                                    ? `${data.sowingsWithReview} con revisión · ${data.sowingsWithoutProduction} sin datos`
                                    : data.sowingsWithReview > 0
                                      ? `${data.sowingsWithReview} con revisión`
                                      : 'según % de germinación del lote'
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
                                Ver siembras
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
                                Ver lotes
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

            <BiDashboard />
        </div>
    );
}

export default DashboardPage;
