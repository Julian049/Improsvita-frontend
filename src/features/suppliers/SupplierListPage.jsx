import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSeedCountsBySupplier, getSuppliers } from './supplierApi';
import {
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
    const [seedCountBySupplier, setSeedCountBySupplier] = useState(new Map());
    const [seedCountsLoaded, setSeedCountsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        let cancelled = false;

        getSuppliers()
            .then((suppliersData) => {
                if (cancelled) return;
                setSuppliers(suppliersData);

                getSeedCountsBySupplier(suppliersData.map((s) => s.supplierId))
                    .then((counts) => {
                        if (cancelled) return;
                        setSeedCountBySupplier(counts);
                        setSeedCountsLoaded(true);
                    })
                    .catch(() => {});
            })
            .catch(() => {
                if (!cancelled) setLoadError('No se pudo cargar la lista de proveedores.');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const processedSuppliers = useMemo(
        () => sortSuppliers(searchSuppliers(suppliers, searchText)),
        [suppliers, searchText]
    );

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
                                                <article key={supplier.supplierId} className="supplier-card">
                                                    <div className="supplier-card-top">
                                                        <div
                                                            className="supplier-av"
                                                            style={{ '--h': getSupplierHue(supplier.name) }}
                                                        >
                                                            {getSupplierInitials(supplier.name)}
                                                        </div>
                                                        <div className="supplier-nm">
                                                            <h3 title={supplier.name}>{supplier.name}</h3>
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

                                                    {seedCountsLoaded && (
                                                        <div className="supplier-foot">
                                                            <div className="supplier-meta">
                                                                Suministra {seedCount}{' '}
                                                                {seedCount === 1 ? 'semilla' : 'semillas'}
                                                            </div>
                                                        </div>
                                                    )}
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
