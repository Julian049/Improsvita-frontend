import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpirationAlerts } from '../../hooks/useExpirationAlerts';
import { formatDate } from '../../utils/dateUtils';
import './NotificationBell.css';

const LEVEL_TAGS = {
    expired: 'Vencido',
    critical: 'Crítico',
    warning: 'Próximo',
};

function BellIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

function AlertItem({ lot, onNavigate }) {
    const { level, label } = lot.expiration;

    return (
        <li>
            <Link
                to={`/lots/${lot.lotId}/edit`}
                className={`notif-item ${level}`}
                onClick={onNavigate}
            >
                <div className="notif-item-top">
                    <span className="notif-item-name">
                        {lot.seedName} · Lote {lot.lotNumber}
                    </span>
                    <span className={`notif-tag ${level}`}>{LEVEL_TAGS[level]}</span>
                </div>
                <div className="notif-item-status">{label}</div>
                <div className="notif-item-meta">
                    Vence el {formatDate(lot.dueDate)} · Disponible: {lot.availableQuantity}
                </div>
            </Link>
        </li>
    );
}

function NotificationBell() {
    const { alerts, expiredCount, isLoading, error, refresh } = useExpirationAlerts();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(e) {
            if (e.key === 'Escape') setIsOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    function handleToggle() {
        if (!isOpen) refresh();
        setIsOpen((prev) => !prev);
    }

    const expired = alerts.filter((lot) => lot.expiration.level === 'expired');
    const upcoming = alerts.filter((lot) => lot.expiration.level !== 'expired');
    const count = alerts.length;
    const closePanel = () => setIsOpen(false);

    return (
        <div className="notif-container" ref={containerRef}>
            <button
                type="button"
                className="notif-button"
                onClick={handleToggle}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label={
                    count > 0
                        ? `Alertas de vencimiento: ${count} ${count === 1 ? 'lote' : 'lotes'}`
                        : 'Alertas de vencimiento: sin alertas'
                }
            >
                <BellIcon />
                {count > 0 && (
                    <span className={`notif-badge ${expiredCount > 0 ? 'expired' : 'upcoming'}`}>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notif-panel" role="region" aria-label="Alertas de vencimiento">
                    <div className="notif-panel-header">
                        <strong>Alertas de vencimiento</strong>
                    </div>

                    <div className="notif-panel-body">
                        {isLoading && <p className="notif-empty">Cargando alertas...</p>}

                        {!isLoading && error && <p className="notif-empty error">{error}</p>}

                        {!isLoading && !error && count === 0 && (
                            <p className="notif-empty">No hay lotes vencidos ni próximos a vencer.</p>
                        )}

                        {!error && expired.length > 0 && (
                            <section>
                                <h4 className="notif-section-title">Vencidos ({expired.length})</h4>
                                <ul className="notif-list">
                                    {expired.map((lot) => (
                                        <AlertItem key={lot.lotId} lot={lot} onNavigate={closePanel} />
                                    ))}
                                </ul>
                            </section>
                        )}

                        {!error && upcoming.length > 0 && (
                            <section>
                                <h4 className="notif-section-title">Próximos a vencer ({upcoming.length})</h4>
                                <ul className="notif-list">
                                    {upcoming.map((lot) => (
                                        <AlertItem key={lot.lotId} lot={lot} onNavigate={closePanel} />
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    <div className="notif-panel-footer">
                        <Link to="/lots" className="notif-footer-link" onClick={closePanel}>
                            Ver todos los lotes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;