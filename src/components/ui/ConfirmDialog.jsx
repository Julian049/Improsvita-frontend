import './ConfirmDialog.css';

function ConfirmDialog({
    title = 'Confirmar acción',
    message,
    details,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isDangerous = true,
    isConfirming = false,
    onConfirm,
    onCancel,
}) {
    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <p>{message}</p>

                {details && <div className="confirm-dialog-details">{details}</div>}

                <div className="confirm-dialog-actions">
                    <button
                        type="button"
                        className="seed-button secondary"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={isDangerous ? 'seed-button danger' : 'seed-button primary'}
                        onClick={onConfirm}
                        disabled={isConfirming}
                    >
                        {isConfirming ? 'Procesando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
