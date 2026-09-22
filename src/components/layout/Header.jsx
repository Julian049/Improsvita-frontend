import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <header className="header">
            <h2>Improsvita</h2>

            <div className="header-user">
                <span>{user?.email || 'Administrador'}</span>
                <button type="button" className="logout-button" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

export default Header;
