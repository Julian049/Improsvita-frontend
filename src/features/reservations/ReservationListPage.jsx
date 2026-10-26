import { Link } from 'react-router-dom';
import '../../components/ui/Catalog.css';

// SUPUESTO: el listado de reservas (RF 5.4) aún no está construido; solo da acceso al registro.
function ReservationListPage() {
    return (
        <div className="catalog-page">
            <div className="catalog-head">
                <h1>Reservas</h1>
                <Link to="/reservations/new" className="seed-button primary">
                    + Registrar reserva
                </Link>
            </div>
        </div>
    );
}

export default ReservationListPage;
