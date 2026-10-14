import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function MainLayout() {
    // Solo afecta a móvil/tablet: en escritorio el menú lateral está siempre visible.
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className={`app ${isMenuOpen ? 'menu-open' : ''}`} onKeyDown={(e) => e.key === 'Escape' && closeMenu()}>
            <Sidebar onNavigate={closeMenu} />
            {isMenuOpen && <div className="app-backdrop" onClick={closeMenu} aria-hidden="true" />}

            <div className="main">
                <Header isMenuOpen={isMenuOpen} onToggleMenu={() => setIsMenuOpen((open) => !open)} />

                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;