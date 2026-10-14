import { useId, useState } from 'react';
import './SearchSelect.css';

// Ignora mayúsculas y tildes: "cafe" encuentra "Café".
const normalize = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Desplegable con buscador. onChange recibe { target: { value } }, igual que un <select>, para reemplazarlo sin tocar los handlers.
function SearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    emptyText = 'Sin resultados',
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
}) {
    const listId = useId();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const selected = options.find((option) => String(option.value) === String(value));
    // shortcut: filtra en memoria la lista ya cargada; pasar a búsqueda en el backend (/seeds/name/{x}, /suppliers por nombre) si las listas crecen.
    const filtered = query
        ? options.filter((option) => normalize(option.label).includes(normalize(query)))
        : options;

    function select(option) {
        onChange({ target: { value: option ? String(option.value) : '' } });
        setIsOpen(false);
        setQuery('');
    }

    function handleInput(e) {
        setQuery(e.target.value);
        setActiveIndex(0);
        setIsOpen(true);
        if (e.target.value === '' && value) select(null);
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) return setIsOpen(true);
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex((i) => Math.min(Math.max(i + step, 0), filtered.length - 1));
        } else if (e.key === 'Enter' && isOpen) {
            e.preventDefault(); // no enviar el formulario al elegir con Enter
            if (filtered[activeIndex]) select(filtered[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
        }
    }

    return (
        <div className="search-select">
            <input
                type="text"
                role="combobox"
                aria-label={ariaLabel}
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={isOpen && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                className={className}
                disabled={disabled}
                placeholder={placeholder}
                value={isOpen ? query : selected?.label ?? ''}
                onChange={handleInput}
                onFocus={() => setIsOpen(true)}
                onClick={() => setIsOpen(true)}
                onBlur={() => {
                    setIsOpen(false);
                    setQuery('');
                }}
                onKeyDown={handleKeyDown}
            />
            {isOpen && (
                <ul id={listId} role="listbox" className="search-select-list">
                    {filtered.length === 0 && <li className="search-select-empty">{emptyText}</li>}
                    {filtered.map((option, index) => (
                        <li
                            key={option.value}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={String(option.value) === String(value)}
                            className={index === activeIndex ? 'active' : ''}
                            // mousedown en vez de click: el blur del input cerraría la lista antes del click.
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(option);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchSelect;
