import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

function Header({ isMenuOpen, onToggleMenu }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                <h2>Improsvita</h2>
            </div>

            <div className="header-user">
                <NotificationBell />
                <span className="header-email">{user?.email || 'Administrador'}</span>
                <button type="button" className="logout-button" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

export default Header;
