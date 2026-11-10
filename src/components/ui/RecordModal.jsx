import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RecordModal.css';

function RecordModal({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const closeRef = useRef(null);
    const hasBackground = Boolean(location.state?.backgroundLocation);

    const close = useCallback(() => {
        if (hasBackground) {
            navigate(-1);
        } else {
            navigate('/');
        }
    }, [hasBackground, navigate]);

    useEffect(() => {
        closeRef.current?.focus();

        function handleKeyDown(e) {
            if (e.key === 'Escape') close();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [close]);

    return (
        <div
            className="record-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
            }}
        >
            <div className="record-modal-panel" role="dialog" aria-modal="true">
                <button
                    ref={closeRef}
                    type="button"
                    className="record-modal-close"
                    onClick={close}
                    aria-label="Cerrar formulario"
                >
                    ×
                </button>
                <div className="record-modal-body">{children}</div>
            </div>
        </div>
    );
}

export default RecordModal;
