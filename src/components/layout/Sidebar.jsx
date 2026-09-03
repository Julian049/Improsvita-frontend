import { NavLink } from 'react-router-dom';

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="logo">
                Improsvita
            </div>

            <nav>
                <NavLink to="/">Panel principal</NavLink>
                <NavLink to="/seeds">Semillas</NavLink>
                <NavLink to="/plantings">Siembras</NavLink>
                <NavLink to="/seedlings">Plántulas</NavLink>
                <NavLink to="/contacts">Contactos</NavLink>
                <NavLink to="/reservations">Reservas</NavLink>
                <NavLink to="/sales">Ventas</NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;