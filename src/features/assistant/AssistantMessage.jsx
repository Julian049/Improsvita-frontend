import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TOOL_LABELS = {
    disponibilidad: 'Disponibilidad',
    reservas: 'Reservas',
    siembras: 'Siembras',
    ventas: 'Ventas',
    'lotes-por-vencer': 'Lotes por vencer',
    'stock-bajo': 'Stock bajo',
    semillas: 'Inventario de semillas',
    clientes: 'Clientes',
    resumen: 'Resumen operativo',
};

function ToolChips({ tools }) {
    if (!tools || tools.length === 0) return null;

    return (
        <div className="assistant-tools" aria-label="Consultas usadas">
            {tools.map((tool) => (
                <span key={tool} className="assistant-tool-chip">
                    {TOOL_LABELS[tool] || tool}
                </span>
            ))}
        </div>
    );
}

function AssistantMessage({ message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`assistant-message ${isUser ? 'user' : 'assistant'}`}>
            <div className="assistant-bubble">
                {isUser ? (
                    <p className="assistant-plain-text">{message.content}</p>
                ) : (
                    <div className="assistant-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {!isUser && <ToolChips tools={message.toolsUsed} />}
            {!isUser && message.degraded && (
                <span className="assistant-degraded">Respuesta con disponibilidad limitada</span>
            )}
        </div>
    );
}

export default AssistantMessage;
