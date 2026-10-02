import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {getSuppliers} from './supplierApi';
import {getAllSeeds} from '../seeds/seedApi';
import './SupplierList.css';

const STOP_WORDS = /^(de|del|y|la|los|el)$/i;

function getInitials(name) {
    return String(name)
        .replace(/[^\p{L}\s]/gu, '')
        .split(/\s+/)
        .filter((word) => word && !STOP_WORDS.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}

function getHue(name) {
    return ([...String(name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6) * 22 + 80;
}

function getLetter(name) {
    const first = String(name).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0];
    return first && /[a-z]/i.test(first) ? first.toUpperCase() : '#';
}

function formatSince(dateValue) {
    if (!dateValue) return '—';
    const date = new Date(`${String(dateValue).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-CO', {month: 'short', year: 'numeric'});
}

function PhoneIcon() {
    return (
        <svg className="supplier-ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="supplier-ic" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M3 7l9 6 9-6"/>
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
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        Promise.all([
            getSuppliers(),
            getAllSeeds().then(
                (data) => ({data, ok: true}),
                () => ({data: [], ok: false})
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

    const seedCountBySupplier = useMemo(() => {
        const map = new Map();
        seeds.forEach((seed) => {
            (seed.supplierIds || []).forEach((id) => {
                const key = String(id);
                map.set(key, (map.get(key) || 0) + 1);
            });
        });
        return map;
    }, [seeds]);

    const counts = useMemo(() => {
        const active = suppliers.filter((supplier) => supplier.active).length;
        return {all: suppliers.length, on: active, off: suppliers.length - active};
    }, [suppliers]);

    const filtered = useMemo(() => {
        const query = searchText.toLowerCase().trim();
        return suppliers
            .filter((supplier) => {
                const haystack = `${supplier.name || ''}${supplier.phone || ''}${supplier.email || ''}`.toLowerCase();
                const matchesQuery = !query || haystack.includes(query);
                const matchesStatus =
                    statusFilter === 'all' || (statusFilter === 'on') === Boolean(supplier.active);
                return matchesQuery && matchesStatus;
            })
            .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
    }, [suppliers, searchText, statusFilter]);

    const groups = useMemo(() => {
        const map = new Map();
        filtered.forEach((supplier) => {
            const letter = getLetter(supplier.name);
            if (!map.has(letter)) map.set(letter, []);
            map.get(letter).push(supplier);
        });
        return [...map.entries()];
    }, [filtered]);

    function handleLetterClick(letter) {
        document
            .getElementById(`supplier-letter-${letter}`)
            ?.scrollIntoView({behavior: 'smooth'});
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
                <div>
                    <h1>Contactos</h1>
                </div>
                <Link to="/suppliers/new" className="supplier-btn">
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
                                className={`supplier-chip ${statusFilter === 'all' ? 'on' : ''}`}
                                onClick={() => setStatusFilter('all')}
                            >
                                Todos<em>{counts.all}</em>
                            </button>
                            <button
                                type="button"
                                className={`supplier-chip ${statusFilter === 'on' ? 'on' : ''}`}
                                onClick={() => setStatusFilter('on')}
                            >
                                Activos<em>{counts.on}</em>
                            </button>
                            <button
                                type="button"
                                className={`supplier-chip red ${statusFilter === 'off' ? 'on' : ''}`}
                                onClick={() => setStatusFilter('off')}
                            >
                                Desactivados<em>{counts.off}</em>
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
                                                            style={{'--h': getHue(supplier.name)}}
                                                        >
                                                            {getInitials(supplier.name)}
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
                                                            <PhoneIcon/>
                                                            <span>{supplier.phone || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <MailIcon/>
                                                            <span>{supplier.email || '—'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="supplier-foot">
                                                        <div className="supplier-meta">
                                                            Proveedor desde {formatSince(supplier.createdDate)}
                                                            {seedsLoaded && (
                                                                <>
                                                                    <br/>
                                                                    Suministra {seedCount}{' '}
                                                                    {seedCount === 1 ? 'semilla' : 'semillas'}
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="supplier-btns">
                                                            <Link
                                                                to={`/suppliers/${supplier.supplierId}/edit`}
                                                                className="supplier-act"
                                                            >
                                                                Editar
                                                            </Link>
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

                    {filtered.length === 0 && (
                        <div className="supplier-list-message">No hay contactos con esos criterios.</div>
                    )}

                    <div className="supplier-pager">
                        Mostrando {filtered.length} de {suppliers.length} contactos
                    </div>
                </>
            )}
        </div>
    );
}

export default SupplierListPage;
