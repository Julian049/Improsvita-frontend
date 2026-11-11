import { useEffect, useState } from 'react';

const LOAD_TIMEOUT_MS = 10000;

// Solo https (o http en localhost); cualquier otra cosa cuenta como "no configurado".
function getValidUrl(raw) {
    try {
        const url = new URL(raw);
        const isLocal = url.protocol === 'http:' && url.hostname === 'localhost';
        return url.protocol === 'https:' || isLocal ? url.href : null;
    } catch {
        return null;
    }
}

const DASHBOARD_URL = getValidUrl(import.meta.env.VITE_DASHBOARD_URL);

function BiDashboard() {
    const [status, setStatus] = useState('loading');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!DASHBOARD_URL) return undefined;
        // shortcut: el navegador no avisa si el sitio bloquea el iframe; solo se detecta la falta de "load".
        const timer = setTimeout(
            () => setStatus((current) => (current === 'loading' ? 'failed' : current)),
            LOAD_TIMEOUT_MS
        );
        return () => clearTimeout(timer);
    }, [attempt]);

    function handleRetry() {
        setStatus('loading');
        setAttempt((n) => n + 1);
    }

    return (
        <section className="dash-box dash-bi" aria-label="Dashboard de Power BI">
            <div className="dash-bi-head">
                <div className="dash-bi-title">
                    <h3>Dashboard de Power BI</h3>
                    <p className="dash-bi-subtitle">
                        Ventas, producción y comportamiento comercial del vivero.
                    </p>
                </div>
                {DASHBOARD_URL && (
                    <a
                        className="dash-bi-link"
                        href={DASHBOARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Abrir en pestaña nueva ↗
                    </a>
                )}
            </div>

            {!DASHBOARD_URL && <p className="dash-muted">Todavía no está configurado.</p>}

            {DASHBOARD_URL && status === 'failed' && (
                <div className="dash-error dash-bi-error" role="alert">
                    No se pudo cargar el dashboard.
                    <button type="button" className="seed-button secondary" onClick={handleRetry}>
                        Reintentar
                    </button>
                </div>
            )}

            {DASHBOARD_URL && status !== 'failed' && (
                <iframe
                    key={attempt}
                    className="dash-bi-frame"
                    title="Dashboard de Power BI"
                    src={DASHBOARD_URL}
                    onLoad={() => setStatus('ready')}
                />
            )}
        </section>
    );
}

export default BiDashboard;
