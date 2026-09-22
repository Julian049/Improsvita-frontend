import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import SeedFormPage from '../features/seeds/seedsForm/SeedFormPage.jsx';
import SeedListPage from "../features/seeds/seedsList/SeedListPage.jsx";
import SupplierListPage from '../features/suppliers/SupplierListPage';
import SupplierFormPage from '../features/suppliers/SupplierFormPage';

function Dashboard() {
    return <h1>Panel principal</h1>;
}

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />

                        <Route path="seeds" element={<SeedListPage />} />
                        <Route path="seeds/new" element={<SeedFormPage />} />
                        <Route path="seeds/:id/edit" element={<SeedFormPage />} />
                        <Route path="suppliers" element={<SupplierListPage />} />
                        <Route path="suppliers/new" element={<SupplierFormPage />} />
                        <Route path="plantings" element={<h1>Siembras</h1>} />
                        <Route path="seedlings" element={<h1>Plántulas</h1>} />
                        <Route path="reservations" element={<h1>Reservas</h1>} />
                        <Route path="sales" element={<h1>Ventas</h1>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;
