import { toLocalDate } from '../../utils/dateUtils';

export const PLANTING_FIELD_LABELS = {
    lotId: 'Lote',
    bedId: 'Cama',
    quantity: 'Cantidad',
    sowingDate: 'Fecha de siembra',
    expectedGerminationDate: 'Germinación esperada',
    notes: 'Notas',
};

export const PLANTING_REQUIRED_FIELDS = ['lotId', 'bedId', 'quantity', 'sowingDate'];

export const PLANTING_LIMITS = {
    quantityDigits: 6,
    notesMax: 300,
};

export const PLANTING_MESSAGES = {
    success: 'Siembra registrada exitosamente.',
    invalidQuantity: 'La cantidad debe ser un número entero mayor que cero.',
    exceedsStock: 'La cantidad solicitada supera el stock disponible del lote.',
    noStock: 'El lote seleccionado no existe o no tiene stock disponible.',
    saveError: 'Error al registrar la siembra. Intente nuevamente o contacte al administrador.',
};

export const PLANTING_FORM_INITIAL_VALUES = {
    lotId: '',
    bedId: '',
    quantity: '',
    sowingDate: '',
    expectedGerminationDate: '',
    notes: '',
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

    if (!isEmpty(values.lotId) && availableStock === null) {
        errors.lotId = PLANTING_MESSAGES.noStock;
    }

    if (!isEmpty(values.quantity)) {
        if (!isPositiveInteger(values.quantity, PLANTING_LIMITS.quantityDigits)) {
            errors.quantity = PLANTING_MESSAGES.invalidQuantity;
        } else if (availableStock !== null && Number(values.quantity) > availableStock) {
            errors.quantity = PLANTING_MESSAGES.exceedsStock;
        }
    }

    if (!isEmpty(values.sowingDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (toLocalDate(values.sowingDate) > today) {
            errors.sowingDate = 'La fecha de siembra no puede ser mayor a la fecha actual.';
        }
    }

    if (!isEmpty(values.expectedGerminationDate) && !isEmpty(values.sowingDate)) {
        if (toLocalDate(values.expectedGerminationDate) < toLocalDate(values.sowingDate)) {
            errors.expectedGerminationDate =
                'La germinación esperada no puede ser menor a la fecha de siembra.';
        }
    }

    if (!isEmpty(values.notes) && values.notes.length > PLANTING_LIMITS.notesMax) {
        errors.notes = `Máximo ${PLANTING_LIMITS.notesMax} caracteres.`;
    }

    return errors;
}