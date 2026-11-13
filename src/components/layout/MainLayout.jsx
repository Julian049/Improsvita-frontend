import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AssistantDrawer from '../../features/assistant/AssistantDrawer';

function MainLayout() {
    // Solo afecta a móvil/tablet: en escritorio el menú lateral está siempre visible.
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const closeMenu = () => setIsMenuOpen(false);
    const openAssistant = () => {
        setIsMenuOpen(false);
        setIsAssistantOpen(true);
    };

    return (
        <div className={`app ${isMenuOpen ? 'menu-open' : ''}`} onKeyDown={(e) => e.key === 'Escape' && closeMenu()}>
            <Sidebar onNavigate={closeMenu} />
            {isMenuOpen && <div className="app-backdrop" onClick={closeMenu} aria-hidden="true" />}

            <div className="main">
                <Header
                    isMenuOpen={isMenuOpen}
                    onToggleMenu={() => setIsMenuOpen((open) => !open)}
                    onOpenAssistant={openAssistant}
                />

                <main className="content">
                    <Outlet />
                </main>
            </div>

            <AssistantDrawer
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
            />
        </div>
    );
}

export default MainLayout;