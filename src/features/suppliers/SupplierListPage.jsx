import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuppliers } from './supplierApi';
import { formatDate } from '../../utils/dateUtils';
import './SupplierList.css';

function SupplierListPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => setLoadError('No se pudo cargar la lista de proveedores.'))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return <div className="supplier-list-loading">Cargando proveedores...</div>;
    }

    if (loadError) {
        return <div className="supplier-list-message error">{loadError}</div>;
    }

    return (
        <div className="supplier-list-page">
            <div className="supplier-list-toolbar">
                <h2>Proveedores</h2>
                <Link to="/suppliers/new" className="seed-button primary">
                    + Añadir proveedor
                </Link>
            </div>

            {suppliers.length === 0 ? (
                <div className="supplier-list-message">No hay proveedores registrados todavía.</div>
            ) : (
                <div className="supplier-table-wrapper">
                    <table className="supplier-table">
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Creado</th>
                            <th>Actualizado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {suppliers.map((supplier) => (
                            <tr key={supplier.supplierId}>
                                <td>{supplier.name}</td>
                                <td>{supplier.phone}</td>
                                <td>{supplier.email || '—'}</td>
                                <td>
                                        <span
                                            className={`supplier-type-badge ${
                                                supplier.active ? 'supplier' : 'client'
                                            }`}
                                        >
                                            {supplier.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td>{formatDate(supplier.createdDate)}</td>
                                <td>{formatDate(supplier.lastUpdated)}</td>
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
