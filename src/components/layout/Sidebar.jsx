import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const MAIN_LINKS = [
    { to: '/', label: 'Panel principal', end: true },
    { to: '/seeds', label: 'Semillas' },
    { to: '/lots', label: 'Lotes' },
    // { to: '/seedlings', label: 'Plántulas' },
    { to: '/sowings', label: 'Siembras' },
];

const SECONDARY_LINKS = [
    // { to: '/reservations', label: 'Reservas' },
    // { to: '/sales', label: 'Ventas' },
    { to: '/suppliers', label: 'Contactos' },
    // { to: '/locations', label: 'Ubicaciones' },
];

function SidebarLink({ to, label, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `app-sidebar-link ${isActive ? 'on' : ''}`}
        >
            {label}
        </NavLink>
    );
}

function Sidebar() {
    return (
        <aside className="app-sidebar">
            <div className="app-sidebar-brand">Improsvita</div>

            <nav className="app-sidebar-nav" aria-label="Navegación principal">
                {MAIN_LINKS.map((link) => (
                    <SidebarLink key={link.to} {...link} />
                ))}

                <div className="app-sidebar-sep" role="separator" />

                {SECONDARY_LINKS.map((link) => (
                    <SidebarLink key={link.to} {...link} />
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
