import { toLocalDate } from '../../utils/dateUtils';

export const PLANTING_FIELD_LABELS = {
    seedId: 'Tipo de semilla',
    quantity: 'Cantidad',
    plantingDate: 'Fecha de siembra',
    harvestDate: 'Fecha estimada de cosecha',
    fumigationFrequencyDays: 'Frecuencia de fumigación',
    observations: 'Observaciones',
};

export const PLANTING_REQUIRED_FIELDS = ['seedId', 'quantity', 'plantingDate', 'harvestDate'];

export const PLANTING_LIMITS = {
    quantityDigits: 6,
    fumigationDigits: 4,
    observationsMax: 300,
};

export const PLANTING_MESSAGES = {
    success: 'Siembra registrada exitosamente.',
    requiredFields: 'Por favor diligencie todos los campos obligatorios.',
    invalidQuantity: 'La cantidad debe ser un número entero mayor que cero.',
    exceedsStock: 'La cantidad solicitada supera el stock disponible.',
    noStock: 'La semilla seleccionada no existe o no tiene stock disponible.',
    saveError: 'Error al registrar la siembra. Intente nuevamente o contacte al administrador.',
};

export const PLANTING_FORM_INITIAL_VALUES = {
    seedId: '',
    quantity: '',
    plantingDate: '',
    harvestDate: '',
    fumigationFrequencyDays: '',
    observations: '',
};

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function isPositiveInteger(value, maxDigits) {
    const text = String(value).trim();
    return /^\d+$/.test(text) && Number(text) > 0 && text.length <= maxDigits;
}


export function validatePlantingForm(values, availableStock = null) {
    const errors = {};

    PLANTING_REQUIRED_FIELDS.forEach((field) => {
        if (isEmpty(values[field])) errors[field] = 'Este campo es obligatorio.';
    });

    if (!isEmpty(values.seedId) && availableStock === null) {
        errors.seedId = PLANTING_MESSAGES.noStock;
    }

    if (!isEmpty(values.quantity)) {
        if (!isPositiveInteger(values.quantity, PLANTING_LIMITS.quantityDigits)) {
            errors.quantity = PLANTING_MESSAGES.invalidQuantity;
        } else if (availableStock !== null && Number(values.quantity) > availableStock) {
            errors.quantity = PLANTING_MESSAGES.exceedsStock;
        }
    }

    if (!isEmpty(values.plantingDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (toLocalDate(values.plantingDate) > today) {
            errors.plantingDate = 'La fecha de siembra no puede ser mayor a la fecha actual.';
        }
    }

    if (!isEmpty(values.harvestDate) && !isEmpty(values.plantingDate)) {
        if (toLocalDate(values.harvestDate) < toLocalDate(values.plantingDate)) {
            errors.harvestDate =
                'La fecha estimada de cosecha no puede ser menor a la fecha de siembra.';
        }
    }

    if (!isEmpty(values.fumigationFrequencyDays)) {
        if (!isPositiveInteger(values.fumigationFrequencyDays, PLANTING_LIMITS.fumigationDigits)) {
            errors.fumigationFrequencyDays =
                'La frecuencia debe ser un número entero de días mayor que cero.';
        }
    }

    if (!isEmpty(values.observations) && values.observations.length > PLANTING_LIMITS.observationsMax) {
        errors.observations = `Máximo ${PLANTING_LIMITS.observationsMax} caracteres.`;
    }

    return errors;
}