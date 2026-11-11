import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RecordModal from '../components/ui/RecordModal.jsx';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import SeedFormPage from '../features/seeds/seedsForm/SeedFormPage.jsx';
import SeedListPage from '../features/seeds/seedsList/SeedListPage.jsx';
import LotFormPage from '../features/lots/lotsForm/LotFormPage.jsx';
import LotListPage from '../features/lots/lotsList/LotListPage.jsx';
import SeedlingListPage from '../features/seedlings/SeedlingListPage.jsx';
import SeedlingReviewPage from '../features/seedlings/SeedlingReviewPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import LotTracePage from '../features/lots/lotTrace/LotTracePage.jsx';
import ContactListPage from '../features/contacts/ContactListPage';
import ContactFormPage from '../features/contacts/ContactFormPage';
import SowingFormPage from '../features/sowings/sowingsForm/SowingFormPage.jsx';
import SowingListPage from '../features/sowings/sowingsList/SowingListPage.jsx';
import LocationListPage from '../features/locations/LocationListPage.jsx';
import LocationFormPage from '../features/locations/LocationFormPage.jsx';
import BedListPage from '../features/beds/BedListPage.jsx';
import BedFormPage from '../features/beds/BedFormPage.jsx';
import SeedTypeListPage from '../features/seedTypes/SeedTypeListPage.jsx';
import SeedTypeFormPage from '../features/seedTypes/SeedTypeFormPage.jsx';
import ReservationFormPage from '../features/reservations/ReservationFormPage.jsx';
import ReservationListPage from '../features/reservations/ReservationListPage.jsx';
import HistoryPage from '../features/history/HistoryPage.jsx';
import PredictionPage from '../features/prediction/PredictionPage.jsx';
import SaleFormPage from '../features/sales/SaleFormPage.jsx';

const MODAL_FORMS = [
    { path: '/seeds/new', element: <SeedFormPage /> },
    { path: '/lots/new', element: <LotFormPage /> },
    { path: '/sowings/new', element: <SowingFormPage /> },
    { path: '/contacts/new', element: <ContactFormPage /> },
    { path: '/reservations/new', element: <ReservationFormPage /> },
    { path: '/beds/new', element: <BedFormPage /> },
    { path: '/locations/new', element: <LocationFormPage /> },
    { path: '/seed-types/new', element: <SeedTypeFormPage /> },
];

function AppRoutes() {
    const location = useLocation();
    const backgroundLocation = location.state?.backgroundLocation;
    const previousBackground = useRef(backgroundLocation);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (previousBackground.current && !backgroundLocation) {
            setRefreshKey((key) => key + 1);
        }
        previousBackground.current = backgroundLocation;
    }, [backgroundLocation]);

    return (
        <>
            <Routes location={backgroundLocation || location} key={refreshKey}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/*<Route element={<ProtectedRoute />}>*/}
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<DashboardPage />} />

                        <Route path="seeds" element={<SeedListPage />} />
                        <Route path="seeds/new" element={<SeedFormPage />} />
                        <Route path="seeds/:id/edit" element={<SeedFormPage />} />
                        <Route path="seed-types" element={<SeedTypeListPage />} />
                        <Route path="seed-types/new" element={<SeedTypeFormPage />} />
                        <Route path="seed-types/:id/edit" element={<SeedTypeFormPage />} />
                        <Route path="lots" element={<LotListPage />} />
                        <Route path="lots/new" element={<LotFormPage />} />
                        <Route path="lots/:id/edit" element={<LotFormPage />} />
                        <Route path="lots/trace" element={<LotTracePage />} />
                        <Route path="contacts" element={<ContactListPage />} />
                        <Route path="contacts/new" element={<ContactFormPage />} />
                        <Route path="contacts/:id/edit" element={<ContactFormPage />} />
                        <Route path="suppliers" element={<Navigate to="/contacts" replace />} />
                        <Route path="suppliers/new" element={<Navigate to="/contacts/new" replace />} />
                        <Route path="suppliers/:id/edit" element={<ContactFormPage />} />
                        <Route path="sowings" element={<SowingListPage />} />
                        <Route path="sowings/new" element={<SowingFormPage />} />
                        <Route path="locations" element={<LocationListPage />} />
                        <Route path="locations/new" element={<LocationFormPage />} />
                        <Route path="locations/:id/edit" element={<LocationFormPage />} />
                        <Route path="beds" element={<BedListPage />} />
                        <Route path="beds/new" element={<BedFormPage />} />
                        <Route path="beds/:id/edit" element={<BedFormPage />} />
                        <Route path="seedlings" element={<SeedlingListPage />} />
                        <Route path="seedlings/:id/reviews" element={<SeedlingReviewPage />} />
                        <Route path="reservations" element={<ReservationListPage />} />
                        <Route path="reservations/new" element={<ReservationFormPage />} />
                        <Route path="reservations/:id/edit" element={<ReservationFormPage />} />
                        <Route path="sales" element={<SaleFormPage />} />
                        <Route path="history" element={<HistoryPage />} />
                        <Route path="prediction" element={<PredictionPage />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                {/*</Route>*/}
            </Routes>

            {backgroundLocation && (
                <Routes>
                    {MODAL_FORMS.map(({ path, element }) => (
                        <Route
                            key={path}
                            path={path}
                            element={<RecordModal>{element}</RecordModal>}
                        />
                    ))}
                </Routes>
            )}
        </>
    );
}

function AppRouter() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default AppRouter;
