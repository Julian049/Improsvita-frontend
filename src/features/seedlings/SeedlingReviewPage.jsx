import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSowingReview, getSeedlings, getSowingReviews } from './seedlingApi';
import {
    REVIEW_FIELD_LABELS,
    REVIEW_NOTES_MAX,
    getReviewFormInitialValues,
    validateReviewForm,
} from './seedlingValidation';
import { getSowingStatusLabel, isTerminalStatus } from '../sowings/sowingStatus';
import { getTodayDateString } from '../sowings/sowingUtils';
import { getApiErrorMessage } from '../../api/apiError';
import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';
import '../../components/ui/Catalog.css';

// Revisiones de germinación de una siembra (/sowings/{id}/reviews): la última fija las plántulas germinadas.
function SeedlingReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sowing, setSowing] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [values, setValues] = useState(getReviewFormInitialValues);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        // shortcut: no hay un GET de siembra con nombres; se reutiliza la lista completa. Cambiar si crece mucho.
        Promise.all([getSeedlings(), getSowingReviews(id)])
            .then(([sowings, reviewsData]) => {
                const found = sowings.find((s) => String(s.sowingId) === String(id));
                if (!found) throw new Error('Siembra no encontrada');
                setSowing(found);
                setReviews(reviewsData);
            })
            .catch(() => setLoadError('No se pudo cargar la siembra.'))
            .finally(() => setIsLoading(false));
    }, [id]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateReviewForm(values, sowing);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors).map((f) => REVIEW_FIELD_LABELS[f] || f).join(', ');
            setSubmitMessage({ type: 'error', text: `Revisa los campos marcados: ${fields}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            const review = await createSowingReview(id, values);
            setReviews((prev) => [...prev, review]);
            setSowing((prev) => ({ ...prev, germinatedQuantity: review.germinatedQuantity }));
            setValues(getReviewFormInitialValues());
            setSubmitMessage({ type: 'success', text: 'Revisión registrada.' });
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo registrar la revisión. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="catalog-message">Cargando siembra...</div>;
    if (loadError) {
        return (
            <div className="catalog-page">
                <div className="catalog-message error">{loadError}</div>
            </div>
        );
    }

    const isClosed = isTerminalStatus(sowing.status);
    const sortedReviews = [...reviews].sort((a, b) => String(b.reviewDate).localeCompare(String(a.reviewDate)));

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>Plántulas de {sowing.seedName || 'la siembra'}</h2>
                <p className="catalog-form-subtitle">
                    Lote {sowing.lotNumber || '—'} · Cama {sowing.bedCode || '—'} · sembradas{' '}
                    {formatQty(sowing.quantitySown)} el {formatDate(sowing.sowingDate)} ·{' '}
                    {getSowingStatusLabel(sowing.status)}
                    <br />
                    Estimadas: {sowing.estimatedSeedlings == null ? '—' : formatQty(sowing.estimatedSeedlings)} ·
                    Germinadas: {sowing.germinatedQuantity == null ? '—' : formatQty(sowing.germinatedQuantity)}
                </p>

                {isClosed ? (
                    <div className="catalog-form-message error">
                        La siembra está {getSowingStatusLabel(sowing.status).toLowerCase()} y ya no admite revisiones.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                        <label className="catalog-field">
                            <span>Cantidad germinada *</span>
                            <input
                                type="number"
                                min="0"
                                max={sowing.quantitySown}
                                step="1"
                                inputMode="numeric"
                                className="no-spinner"
                                value={values.germinatedQuantity}
                                onChange={handleChange('germinatedQuantity')}
                            />
                            {errors.germinatedQuantity ? (
                                <small className="field-error">{errors.germinatedQuantity}</small>
                            ) : (
                                <small>{`Máximo ${formatQty(sowing.quantitySown)} (lo sembrado).`}</small>
                            )}
                        </label>

                        <label className="catalog-field">
                            <span>Fecha de revisión *</span>
                            <input
                                type="date"
                                min={sowing.sowingDate || undefined}
                                max={getTodayDateString()}
                                value={values.reviewDate}
                                onChange={handleChange('reviewDate')}
                            />
                            {errors.reviewDate && <small className="field-error">{errors.reviewDate}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Observaciones (opcional)</span>
                            <textarea maxLength={REVIEW_NOTES_MAX} value={values.notes} onChange={handleChange('notes')} />
                            {errors.notes ? (
                                <small className="field-error">{errors.notes}</small>
                            ) : (
                                <small>{`${values.notes.length}/${REVIEW_NOTES_MAX}`}</small>
                            )}
                        </label>

                        {submitMessage && (
                            <div className={`catalog-form-message ${submitMessage.type}`}>{submitMessage.text}</div>
                        )}

                        <div className="catalog-form-actions">
                            <button type="button" className="seed-button secondary" onClick={() => navigate('/seedlings')}>
                                Volver
                            </button>
                            <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Registrar revisión'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="catalog-table-wrapper">
                <table className="catalog-table">
                    <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Germinadas</th>
                        <th>Observaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedReviews.length === 0 ? (
                        <tr>
                            <td colSpan={3}>Sin revisiones todavía.</td>
                        </tr>
                    ) : (
                        sortedReviews.map((review) => (
                            <tr key={review.reviewId}>
                                <td>{formatDate(review.reviewDate)}</td>
                                <td>{formatQty(review.germinatedQuantity)}</td>
                                <td>{review.notes || '—'}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SeedlingReviewPage;
