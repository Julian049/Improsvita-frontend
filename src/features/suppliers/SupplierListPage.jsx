import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuppliers } from './supplierApi';
import { getAllSeeds } from '../seeds/seedApi';
import { formatDate } from '../../utils/dateUtils';
import {
    SUPPLIER_STATUS_FILTERS,
    countSeedsBySupplier,
    countSuppliersByStatus,
    filterSuppliers,
    getSupplierHue,
    getSupplierInitials,
    groupSuppliersByLetter,
    searchSuppliers,
    sortSuppliers,
} from './supplierListUtils.js';
import './SupplierList.css';

function PhoneIcon() {
    return (
        <svg className="supplier-ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="supplier-ic" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
        </svg>
    );
}

function SupplierListPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [seedsLoaded, setSeedsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState(SUPPLIER_STATUS_FILTERS.all);

    useEffect(() => {
        Promise.all([
            getSuppliers(),
            getAllSeeds().then(
                (data) => ({ data, ok: true }),
                () => ({ data: [], ok: false })
            ),
        ])
            .then(([suppliersData, seedsResult]) => {
                setSuppliers(suppliersData);
                setSeeds(seedsResult.data);
                setSeedsLoaded(seedsResult.ok);
            })
            .catch(() => setLoadError('No se pudo cargar la lista de proveedores.'))
            .finally(() => setIsLoading(false));
    }, []);

    const seedCountBySupplier = useMemo(() => countSeedsBySupplier(seeds), [seeds]);
    const counts = useMemo(() => countSuppliersByStatus(suppliers), [suppliers]);

    const processedSuppliers = useMemo(() => {
        const searched = searchSuppliers(suppliers, searchText);
        const filtered = filterSuppliers(searched, statusFilter);
        return sortSuppliers(filtered);
    }, [suppliers, searchText, statusFilter]);

    const groups = useMemo(() => groupSuppliersByLetter(processedSuppliers), [processedSuppliers]);

    function handleLetterClick(letter) {
        document
            .getElementById(`supplier-letter-${letter}`)
            ?.scrollIntoView({ behavior: 'smooth' });
    }

    if (isLoading) {
        return <div className="supplier-list-loading">Cargando proveedores...</div>;
    }

    if (loadError) {
        return <div className="supplier-list-message error">{loadError}</div>;
    }

    return (
        <div className="supplier-list-page">
            <div className="supplier-head">
                <h1>Contactos</h1>
                <Link to="/suppliers/new" className="seed-button primary">
                    + Registrar proveedor
                </Link>
            </div>

            {suppliers.length === 0 ? (
                <div className="supplier-list-message">No hay proveedores registrados todavía.</div>
            ) : (
                <>
                    <div className="supplier-bar">
                        <input
                            type="search"
                            className="supplier-search"
                            placeholder="Buscar por nombre, teléfono o correo"
                            aria-label="Buscar contactos"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <div className="supplier-chips" role="group" aria-label="Estado">
                            <button
                                type="button"
                                className={`supplier-chip ${statusFilter === SUPPLIER_STATUS_FILTERS.all ? 'on' : ''}`}
                                onClick={() => setStatusFilter(SUPPLIER_STATUS_FILTERS.all)}
                            >
                                Todos<em>{counts.all}</em>
                            </button>
                            <button
                                type="button"
                                className={`supplier-chip ${statusFilter === SUPPLIER_STATUS_FILTERS.active ? 'on' : ''}`}
                                onClick={() => setStatusFilter(SUPPLIER_STATUS_FILTERS.active)}
                            >
                                Activos<em>{counts.active}</em>
                            </button>
                            <button
                                type="button"
                                className={`supplier-chip red ${statusFilter === SUPPLIER_STATUS_FILTERS.inactive ? 'on' : ''}`}
                                onClick={() => setStatusFilter(SUPPLIER_STATUS_FILTERS.inactive)}
                            >
                                Desactivados<em>{counts.inactive}</em>
                            </button>
                        </div>
                    </div>

                    <div className="supplier-wrap">
                        <div>
                            {groups.map(([letter, items]) => (
                                <div key={letter}>
                                    <div className="supplier-letter" id={`supplier-letter-${letter}`}>
                                        {letter}
                                    </div>
                                    <div className="supplier-grid">
                                        {items.map((supplier) => {
                                            const seedCount = seedCountBySupplier.get(String(supplier.supplierId)) || 0;
                                            return (
                                                <article
                                                    key={supplier.supplierId}
                                                    className={`supplier-card ${supplier.active ? '' : 'off'}`}
                                                >
                                                    <div className="supplier-card-top">
                                                        <div
                                                            className="supplier-av"
                                                            style={{ '--h': getSupplierHue(supplier.name) }}
                                                        >
                                                            {getSupplierInitials(supplier.name)}
                                                        </div>
                                                        <div className="supplier-nm">
                                                            <h3 title={supplier.name}>{supplier.name}</h3>
                                                            <span className="supplier-state">
                                                                {supplier.active ? 'Activo' : 'Desactivado'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="supplier-info">
                                                        <div>
                                                            <PhoneIcon />
                                                            <span>{supplier.phone || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <MailIcon />
                                                            <span>{supplier.email || '—'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="supplier-foot">
                                                        <div className="supplier-meta">
                                                            Proveedor desde {formatDate(supplier.createdDate)}
                                                            {seedsLoaded && (
                                                                <>
                                                                    <br />
                                                                    Suministra {seedCount}{' '}
                                                                    {seedCount === 1 ? 'semilla' : 'semillas'}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <nav className="supplier-rail" aria-label="Índice alfabético">
                            {groups.map(([letter]) => (
                                <button
                                    key={letter}
                                    type="button"
                                    aria-label={`Ir a ${letter}`}
                                    onClick={() => handleLetterClick(letter)}
                                >
                                    {letter}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {processedSuppliers.length === 0 && (
                        <div className="supplier-list-message">No hay contactos con esos criterios.</div>
                    )}

                    <div className="supplier-pager">
                        Mostrando {processedSuppliers.length} de {suppliers.length} contactos
                    </div>
                </>
            )}
        </div>
    );
}

export default SupplierListPage;
