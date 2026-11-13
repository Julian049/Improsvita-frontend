import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import NotificationBell from './NotificationBell';

const PAGES = [
    { path: '/lots/trace', title: 'Trazabilidad de lote', subtitle: 'Consulta el recorrido completo de un lote.' },
    { path: '/seeds/new', title: 'Semillas', subtitle: 'Registra una nueva semilla en el catálogo.' },
    { path: '/seeds', title: 'Semillas', subtitle: 'Catálogo, tipos y disponibilidad del inventario.' },
    { path: '/lots/new', title: 'Lotes', subtitle: 'Registra la entrada de un nuevo lote.' },
    { path: '/lots', title: 'Lotes', subtitle: 'Inventario de lotes y movimientos de stock.' },
    { path: '/seedlings', title: 'Plántulas', subtitle: 'Seguimiento de germinación y disponibilidad.' },
    { path: '/sowings/new', title: 'Siembras', subtitle: 'Planifica una nueva siembra en cama.' },
    { path: '/sowings', title: 'Siembras', subtitle: 'Estado y avance de las siembras activas.' },
    { path: '/sales', title: 'Venta directa', subtitle: 'Registra la venta de plántulas sin reserva.' },
    { path: '/history', title: 'Historial', subtitle: 'Ventas directas y entregas de reserva.' },
    { path: '/reservations', title: 'Reservas', subtitle: 'Compromisos de producción por cliente.' },
    { path: '/contacts', title: 'Contactos', subtitle: 'Clientes, proveedores y colaboradores.' },
    { path: '/seed-types', title: 'Tipos de semilla', subtitle: 'Clasificación del catálogo de semillas.' },
    { path: '/locations', title: 'Ubicaciones', subtitle: 'Áreas físicas del vivero.' },
    { path: '/beds', title: 'Camas', subtitle: 'Capacidad y ocupación de las camas.' },
    { path: '/prediction', title: 'Predicción', subtitle: 'Estimación de producción y demanda.' },
    { path: '/', title: 'Panel principal', subtitle: 'Resumen operativo del vivero.' },
];

function getPageMeta(pathname) {
    const page = PAGES.find(
        ({ path }) => pathname === path || pathname.startsWith(`${path}/`)
    );
    return page ?? { title: 'Improsvita', subtitle: 'Gestión de vivero' };
}

function AssistantIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
            <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
        </svg>
    );
}

function Header({ isMenuOpen, onToggleMenu, onOpenAssistant }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const page = getPageMeta(pathname);
    const initial = (user?.email || 'A').charAt(0).toUpperCase();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <header className="header">
            <div className="header-brand">
                <button
                    type="button"
                    className="menu-button"
                    aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={isMenuOpen}
                    aria-controls="app-sidebar"
                    onClick={onToggleMenu}
                >
                    ☰
                </button>
                <div>
                    <h2 className="header-title">{page.title}</h2>
                    <span className="header-subtitle">{page.subtitle}</span>
                </div>
            </div>

            <div className="header-user">
                <button
                    type="button"
                    className="assistant-launch"
                    onClick={onOpenAssistant}
                    aria-label="Abrir asistente"
                >
                    <AssistantIcon />
                    <span className="assistant-launch-label">Asistente</span>
                </button>
                <NotificationBell />
                <div className="user-chip">
                    <span className="user-avatar" aria-hidden="true">{initial}</span>
                    <span className="header-email">{user?.email || 'Administrador'}</span>
                </div>
                <button type="button" className="logout-button" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

export default Header;
