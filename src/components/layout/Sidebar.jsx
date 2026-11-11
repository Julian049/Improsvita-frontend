import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const MAIN_LINKS = [
    { to: '/', label: 'Panel principal', end: true, icon: 'dashboard' },
    { to: '/seeds', label: 'Semillas', icon: 'seeds' },
    { to: '/lots', label: 'Lotes', icon: 'lots' },
    { to: '/seedlings', label: 'Plántulas', icon: 'seedlings' },
    { to: '/sowings', label: 'Siembras', icon: 'sowings' },
];

const SALES_LINKS = [
    { to: '/sales', label: 'Venta directa', icon: 'sales' },
    { to: '/history', label: 'Historial', icon: 'history' },
    { to: '/reservations', label: 'Reservas', icon: 'reservations' },
];

const SECONDARY_LINKS = [
    { to: '/contacts', label: 'Contactos', icon: 'contacts' },
    { to: '/seed-types', label: 'Tipos de semilla', icon: 'types' },
    { to: '/locations', label: 'Ubicaciones', icon: 'locations' },
    { to: '/beds', label: 'Camas', icon: 'beds' },
];

const ICONS = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.6" />
            <rect x="14" y="3" width="7" height="7" rx="1.6" />
            <rect x="3" y="14" width="7" height="7" rx="1.6" />
            <rect x="14" y="14" width="7" height="7" rx="1.6" />
        </>
    ),
    seeds: (
        <>
            <path d="M4 20c0-8 6-14 16-16 0 10-6 16-16 16Z" />
            <path d="M4 20c4-1 8-4 10-8" />
        </>
    ),
    lots: (
        <>
            <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
            <path d="m3 8.5 9 5.5 9-5.5" />
            <path d="M12 14v7" />
        </>
    ),
    seedlings: (
        <>
            <path d="M12 21v-7" />
            <path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Z" />
            <path d="M12 14C12 10 9 7 5 7c0 4 3 7 7 7Z" />
        </>
    ),
    sowings: (
        <>
            <path d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="7" cy="6" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="10" cy="12" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="13" cy="18" r="1.4" fill="currentColor" stroke="none" />
        </>
    ),
    sales: (
        <>
            <path d="M20 13 13 20 4 11V4h7l9 9Z" />
            <circle cx="8" cy="8" r="1.5" />
        </>
    ),
    history: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    reservations: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
        </>
    ),
    contacts: (
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <circle cx="17.5" cy="9" r="2.5" />
            <path d="M17 14c2.8 0 5 2.2 5 5" />
        </>
    ),
    types: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
        </>
    ),
    locations: (
        <>
            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    beds: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18M9 4v16M15 4v16" />
        </>
    ),
};

function NavIcon({ name }) {
    return (
        <svg
            className="app-sidebar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICONS[name]}
        </svg>
    );
}

function SidebarLink({ to, label, end, icon, onNavigate }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `app-sidebar-link ${isActive ? 'on' : ''}`}
        >
            <NavIcon name={icon} />
            <span>{label}</span>
        </NavLink>
    );
}

function Sidebar({ onNavigate }) {
    return (
        <aside id="app-sidebar" className="app-sidebar">
            <div className="app-sidebar-brand">
                <img className="app-sidebar-logo" src="/improscol-icon.png" alt="Improscol" />
                <div className="app-sidebar-brand-text">
                    <strong>Improsvita</strong>
                    <span>Gestión de vivero</span>
                </div>
            </div>

            <nav className="app-sidebar-nav" aria-label="Navegación principal">
                <div className="app-sidebar-group">Operación</div>
                {MAIN_LINKS.map((link) => (
                    <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
                ))}

                <div className="app-sidebar-sep" role="separator" />

                <div className="app-sidebar-group">Comercial</div>
                {SALES_LINKS.map((link) => (
                    <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
                ))}

                <div className="app-sidebar-sep" role="separator" />

                <div className="app-sidebar-group">Configuración</div>
                {SECONDARY_LINKS.map((link) => (
                    <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
                ))}
            </nav>

            <div className="app-sidebar-footer">
                <span className="app-sidebar-status" aria-hidden="true" />
                Operación en línea
            </div>
        </aside>
    );
}

export default Sidebar;
