import { getTodayDateString } from '../sowings/sowingUtils';

export const REVIEW_NOTES_MAX = 1000;

export const REVIEW_FIELD_LABELS = {
    reviewDate: 'Fecha de revisión',
    germinatedQuantity: 'Cantidad germinada',
    notes: 'Observaciones',
};

// Mismas reglas que SowingReviewService del backend.
export function validateReviewForm(values, { quantitySown, sowingDate } = {}) {
    const errors = {};

    if (String(values.germinatedQuantity ?? '').trim() === '') {
        errors.germinatedQuantity = 'Este campo es obligatorio.';
    } else {
        const quantity = Number(values.germinatedQuantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            errors.germinatedQuantity = 'Debe ser un número entero de 0 o más.';
        } else if (quantitySown != null && quantity > quantitySown) {
            errors.germinatedQuantity = `No puede superar lo sembrado (${quantitySown}).`;
        }
    }

    if (!values.reviewDate) {
        errors.reviewDate = 'Este campo es obligatorio.';
    } else if (values.reviewDate > getTodayDateString()) {
        errors.reviewDate = 'No puede ser una fecha futura.';
    } else if (sowingDate && values.reviewDate < sowingDate) {
        errors.reviewDate = 'No puede ser anterior a la fecha de siembra.';
    }

    if ((values.notes ?? '').trim().length > REVIEW_NOTES_MAX) {
        errors.notes = `Máximo ${REVIEW_NOTES_MAX} caracteres.`;
    }

    return errors;
}

export function getReviewFormInitialValues() {
    return { reviewDate: getTodayDateString(), germinatedQuantity: '', notes: '' };
}
