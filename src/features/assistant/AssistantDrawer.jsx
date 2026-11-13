import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../../api/apiError';
import AssistantMessage from './AssistantMessage';
import { getAssistantHealth, sendAssistantMessage } from './assistantApi';
import './AssistantDrawer.css';

const WELCOME_ID = 'assistant-welcome';

const SUGGESTIONS = [
    '¿Cuántas plántulas hay disponibles?',
    '¿Qué reservas están vigentes?',
    '¿Cómo fueron las ventas de los últimos 30 días?',
    '¿Qué lotes vencen pronto?',
];

const WELCOME = {
    id: WELCOME_ID,
    role: 'assistant',
    content:
        'Hola, soy improsBot. Puedo consultar disponibilidad, reservas, siembras, ventas, ' +
        'lotes e inventario de Improsvita. ¿Qué necesitas revisar?',
};

function nextMessageId() {
    return `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SparkIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
            <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
            <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
    );
}

function AssistantDrawer({ isOpen, onClose }) {
    const [messages, setMessages] = useState([WELCOME]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [health, setHealth] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [healthError, setHealthError] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        let active = true;

        getAssistantHealth()
            .then((data) => {
                if (active) {
                    setHealth(data);
                    setHealthError(false);
                }
            })
            .catch(() => {
                if (active) {
                    setHealth(null);
                    setHealthError(true);
                }
            })
            .finally(() => {
                if (active) setHealthLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);

        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !listRef.current) return;
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [isOpen, messages, isLoading]);

    if (!isOpen) return null;

    const isConfigured = health?.configured !== false;

    function buildHistory() {
        return messages
            .filter((message) => message.id !== WELCOME_ID && message.content)
            .slice(-8)
            .map(({ role, content }) => ({ role, content }));
    }

    async function submit(questionText) {
        const question = (questionText ?? input).trim();
        if (!question || isLoading || !isConfigured) return;

        const history = buildHistory();
        const userMessage = {
            id: nextMessageId(),
            role: 'user',
            content: question,
        };

        setMessages((current) => [...current, userMessage]);
        setInput('');
        setError('');
        setIsLoading(true);

        try {
            const data = await sendAssistantMessage({ message: question, history });
            const reply = data?.reply?.trim() || 'No obtuve una respuesta útil. Intenta reformular.';

            setMessages((current) => [
                ...current,
                {
                    id: nextMessageId(),
                    role: 'assistant',
                    content: reply,
                    toolsUsed: data?.toolsUsed || [],
                    degraded: Boolean(data?.degraded),
                },
            ]);

            if (data?.available === false) {
                setHealth((current) => ({
                    ...(current || {}),
                    enabled: true,
                    configured: false,
                    message: 'Configura GROQ_API_KEY para activar el asistente.',
                }));
            }
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    'No se pudo conectar con el asistente. Revisa que el backend esté activo.'
                )
            );
        } finally {
            setIsLoading(false);
            window.requestAnimationFrame(() => inputRef.current?.focus());
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        submit();
    }

    function handleInputKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    }

    function handleClear() {
        setMessages([WELCOME]);
        setInput('');
        setError('');
        window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    const statusClass = healthLoading
        ? 'loading'
        : healthError
          ? 'error'
          : health?.configured
            ? 'ok'
            : 'warn';

    const statusLabel = healthLoading
        ? 'Verificando'
        : healthError
          ? 'Sin verificar'
          : health?.configured
            ? 'En línea'
            : 'Sin configurar';

    return (
        <div className="assistant-backdrop" onMouseDown={onClose}>
            <aside
                className="assistant-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Asistente de Improsvita"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="assistant-header">
                    <div className="assistant-heading">
                        <span className="assistant-heading-icon"><SparkIcon /></span>
                        <div>
                            <h2>Asistente</h2>
                            <span className="assistant-subtitle">Consulta tus datos del vivero</span>
                        </div>
                    </div>

                    <div className="assistant-header-actions">
                        <span
                            className={`assistant-status ${statusClass}`}
                            title={health?.message || 'Estado del asistente'}
                        >
                            <span className="assistant-status-dot" aria-hidden="true" />
                            {statusLabel}
                        </span>
                        <button
                            type="button"
                            className="assistant-icon-button"
                            onClick={onClose}
                            aria-label="Cerrar asistente"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                {!isConfigured && (
                    <div className="assistant-config-warning" role="status">
                        El asistente no está configurado. Define <code>GROQ_API_KEY</code> en el
                        entorno del backend y reinícialo.
                    </div>
                )}

                {healthError && (
                    <div className="assistant-config-warning" role="status">
                        No se pudo verificar el estado del asistente. Puedes intentar preguntar igual.
                    </div>
                )}

                <div className="assistant-messages" ref={listRef} aria-live="polite">
                    {messages.map((message) => (
                        <AssistantMessage key={message.id} message={message} />
                    ))}

                    {isLoading && (
                        <div className="assistant-message assistant">
                            <div className="assistant-bubble assistant-typing" aria-label="Consultando">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}
                </div>

                {messages.length === 1 && !isLoading && (
                    <div className="assistant-suggestions">
                        {SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                className="assistant-suggestion"
                                onClick={() => submit(suggestion)}
                                disabled={!isConfigured}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="assistant-error" role="alert">
                        {error}
                    </div>
                )}

                <form className="assistant-composer" onSubmit={handleSubmit}>
                    <textarea
                        ref={inputRef}
                        className="assistant-input"
                        placeholder={
                            isConfigured
                                ? 'Pregunta sobre plántulas, reservas, ventas o lotes...'
                                : 'Asistente sin configurar'
                        }
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        maxLength={1000}
                        rows={1}
                        disabled={!isConfigured || isLoading}
                    />
                    <button
                        type="submit"
                        className="assistant-send"
                        disabled={!isConfigured || isLoading || !input.trim()}
                        aria-label="Enviar pregunta"
                    >
                        <SendIcon />
                    </button>
                </form>

                <footer className="assistant-footer">
                    <span>Enter para enviar · Shift+Enter para salto de línea</span>
                    {messages.length > 1 && (
                        <button type="button" className="assistant-clear" onClick={handleClear}>
                            Limpiar
                        </button>
                    )}
                </footer>
            </aside>
        </div>
    );
}

export default AssistantDrawer;
