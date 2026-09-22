import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuppliers } from './supplierApi';
import './SupplierList.css';

function SupplierListPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => setLoadError('No se pudo cargar la lista de contactos.'))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return <div className="supplier-list-loading">Cargando contactos...</div>;
    }

    if (loadError) {
        return <div className="supplier-list-message error">{loadError}</div>;
    }

    return (
        <div className="supplier-list-page">
            <div className="supplier-list-toolbar">
                <h2>Contactos</h2>
                <Link to="/suppliers/new" className="seed-button primary">
                    + Añadir contacto
                </Link>
            </div>

            {suppliers.length === 0 ? (
                <div className="supplier-list-message">No hay contactos registrados todavía.</div>
            ) : (
                <div className="supplier-table-wrapper">
                    <table className="supplier-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Identificación</th>
                                <th>Tipo</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Dirección</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>{supplier.name}</td>
                                    <td>{supplier.identification}</td>
                                    <td>
                                        <span
                                            className={`supplier-type-badge ${
                                                supplier.supplierType === 'Proveedor' ? 'supplier' : 'client'
                                            }`}
                                        >
                                            {supplier.supplierType}
                                        </span>
                                    </td>
                                    <td>{supplier.phone}</td>
                                    <td>{supplier.email || '—'}</td>
                                    <td>{supplier.address || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SupplierListPage;
