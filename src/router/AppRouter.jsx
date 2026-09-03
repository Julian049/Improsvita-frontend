import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

function Dashboard() {
    return <h1>Panel principal</h1>;
}

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />

                    <Route path="seeds" element={<h1>Semillas</h1>} />
                    <Route path="contacts" element={<h1>Contactos</h1>} />
                    <Route path="plantings" element={<h1>Siembras</h1>} />
                    <Route path="seedlings" element={<h1>Plántulas</h1>} />
                    <Route path="reservations" element={<h1>Reservas</h1>} />
                    <Route path="sales" element={<h1>Ventas</h1>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;