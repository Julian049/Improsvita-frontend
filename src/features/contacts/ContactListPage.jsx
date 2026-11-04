import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deactivateContact, getContacts } from './contactApi';
import { CONTACT_ROLE_OPTIONS, getRoleLabel } from './contactRoles';
import { getApiErrorMessage } from '../../api/apiError';
import '../suppliers/SupplierList.css';
import './Contact.css';

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

function getInitials(name) {
    return (name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}

function getHue(name) {
    let hash = 0;
    for (const char of name || '') {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }
    return hash;
}

function ContactListPage() {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;

        getContacts(null, true)
            .then((data) => {
                if (!cancelled) setContacts(data);
            })
            .catch(() => {
                if (!cancelled) setLoadError('No se pudo cargar la lista de contactos.');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredContacts = useMemo(() => {
        const term = query.trim().toLowerCase();

        return contacts
            .filter((contact) => {
                if (roleFilter !== 'ALL' && !contact.roles?.includes(roleFilter)) {
                    return false;
                }
                if (!term) return true;
                return [contact.name, contact.email, contact.phone]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(term));
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }, [contacts, query, roleFilter]);

    async function handleDeactivate(contact) {
        if (!window.confirm(`¿Desactivar a ${contact.name}?`)) return;

        setBusyId(contact.id);
        setActionError(null);
        try {
            await deactivateContact(contact.id);
            setContacts((prev) =>
                prev.map((item) => (item.id === contact.id ? { ...item, active: false } : item))
            );
        } catch (err) {
            setActionError(
                getApiErrorMessage(err, 'No se pudo desactivar el contacto. Intenta nuevamente.')
            );
        } finally {
            setBusyId(null);
        }
    }

    function renderContent() {
        if (isLoading) {
            return <div className="supplier-list-loading">Cargando contactos...</div>;
        }

        if (loadError) {
            return <div className="supplier-list-message error">{loadError}</div>;
        }

        if (filteredContacts.length === 0) {
            return (
                <div className="supplier-list-message">
                    {contacts.length === 0
                        ? 'No hay contactos registrados todavía.'
                        : 'No hay contactos que coincidan con el filtro.'}
                </div>
            );
        }

        return (
            <>
                <div className="supplier-grid">
                    {filteredContacts.map((contact) => (
                        <article
                            key={contact.id}
                            className={`supplier-card contact-card ${contact.active ? '' : 'off'}`}
                        >
                            <div className="supplier-card-top">
                                <div
                                    className="supplier-av"
                                    style={{ '--h': getHue(contact.name) }}
                                >
                                    {getInitials(contact.name)}
                                </div>
                                <div className="supplier-nm">
                                    <h3 title={contact.name}>{contact.name}</h3>
                                    {!contact.active && <span className="contact-inactive">Inactivo</span>}
                                </div>
                            </div>

                            <div className="contact-roles">
                                {(contact.roles || []).map((role) => (
                                    <span
                                        key={role}
                                        className={`contact-role ${role.toLowerCase()}`}
                                    >
                                        {getRoleLabel(role)}
                                    </span>
                                ))}
                            </div>

                            <div className="supplier-info">
                                <div>
                                    <PhoneIcon />
                                    <span>{contact.phone || '—'}</span>
                                </div>
                                <div>
                                    <MailIcon />
                                    <span>{contact.email || '—'}</span>
                                </div>
                            </div>

                            <div className="supplier-foot">
                                <div className="contact-actions">
                                    <Link to={`/contacts/${contact.id}/edit`} className="supplier-link">
                                        Editar
                                    </Link>
                                    {contact.active && (
                                        <button
                                            type="button"
                                            className="contact-deactivate"
                                            disabled={busyId === contact.id}
                                            onClick={() => handleDeactivate(contact)}
                                        >
                                            {busyId === contact.id ? 'Desactivando...' : 'Desactivar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="supplier-pager">
                    Mostrando {filteredContacts.length} de {contacts.length}{' '}
                    {contacts.length === 1 ? 'contacto' : 'contactos'}
                </div>
            </>
        );
    }

    return (
        <div className="supplier-list-page">
            <div className="supplier-head">
                <h1>Contactos</h1>
                <Link to="/contacts/new" className="seed-button primary">
                    + Registrar contacto
                </Link>
            </div>

            <div className="contact-toolbar">
                <div className="contact-filters">
                    <button
                        type="button"
                        className={`supplier-chip ${roleFilter === 'ALL' ? 'on' : ''}`}
                        onClick={() => setRoleFilter('ALL')}
                    >
                        Todos
                    </button>
                    {CONTACT_ROLE_OPTIONS.map((role) => (
                        <button
                            key={role.value}
                            type="button"
                            className={`supplier-chip ${roleFilter === role.value ? 'on' : ''}`}
                            onClick={() => setRoleFilter(role.value)}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>

                <input
                    type="search"
                    className="supplier-search"
                    placeholder="Buscar por nombre, correo o teléfono"
                    aria-label="Buscar contacto"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {actionError && <div className="supplier-list-message error">{actionError}</div>}

            {renderContent()}
        </div>
    );
}

export default ContactListPage;
