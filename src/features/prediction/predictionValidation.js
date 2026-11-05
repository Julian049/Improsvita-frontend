export const PREDICTION_FIELD_LABELS = {
    seedId: 'Semilla',
    from: 'Desde',
    to: 'Hasta',
};

export function validatePredictionForm(values) {
    const errors = {};

    Object.keys(PREDICTION_FIELD_LABELS).forEach((field) => {
        if (String(values[field] ?? '').trim() === '') {
            errors[field] = 'Este campo es obligatorio.';
        }
    });

    if (!errors.from && !errors.to && values.to < values.from) {
        errors.to = 'La fecha final no puede ser anterior a la inicial.';
    }

    return errors;
}

export function getPredictionFormInitialValues() {
    return { seedId: '', from: '', to: '' };
}
