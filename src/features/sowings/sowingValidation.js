import { toLocalDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';

export const SOWING_FIELD_LABELS = {
    lotId: 'Lote',
    bedId: 'Cama',
    quantity: 'Cantidad',
    sowingDate: 'Fecha de siembra',
    expectedGerminationDate: 'Germinación esperada',
    notes: 'Notas',
};

// SowRequest del backend: sowingDate vacía la toma como hoy; expectedGerminationDate y notes son opcionales.
export const SOWING_REQUIRED_FIELDS = ['lotId', 'bedId', 'quantity'];

export const SOWING_LIMITS = {
    quantityDigits: 6,
    notesMax: 300,
};

export const SOWING_MESSAGES = {
    success: 'Siembra registrada exitosamente.',
    invalidQuantity: 'La cantidad debe ser un número entero mayor que cero.',
    exceedsStock: 'La cantidad solicitada supera el stock disponible del lote.',
    bedFull: 'La cama no tiene espacio libre.',
    exceedsBed: (free) => `La cantidad supera el espacio libre de la cama (${formatQty(free)}).`,
    noStock: 'El lote seleccionado no existe o no tiene stock disponible.',
    saveError: 'Error al registrar la siembra. Intente nuevamente o contacte al administrador.',
};

export const SOWING_FORM_INITIAL_VALUES = {
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

// bedFree: espacio libre de la cama, o null si no tiene capacidad máxima definida.
export function validateSowingForm(values, { availableStock = null, bedFree = null } = {}) {
    const errors = {};

    SOWING_REQUIRED_FIELDS.forEach((field) => {
        if (isEmpty(values[field])) errors[field] = 'Este campo es obligatorio.';
    });

    if (!isEmpty(values.lotId) && availableStock === null) {
        errors.lotId = SOWING_MESSAGES.noStock;
    }

    if (!isEmpty(values.bedId) && bedFree === 0) {
        errors.bedId = SOWING_MESSAGES.bedFull;
    }

    if (!isEmpty(values.quantity)) {
        if (!isPositiveInteger(values.quantity, SOWING_LIMITS.quantityDigits)) {
            errors.quantity = SOWING_MESSAGES.invalidQuantity;
        } else if (availableStock !== null && Number(values.quantity) > availableStock) {
            errors.quantity = SOWING_MESSAGES.exceedsStock;
        } else if (bedFree !== null && Number(values.quantity) > bedFree) {
            errors.quantity = SOWING_MESSAGES.exceedsBed(bedFree);
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

    if (!isEmpty(values.notes) && values.notes.length > SOWING_LIMITS.notesMax) {
        errors.notes = `Máximo ${SOWING_LIMITS.notesMax} caracteres.`;
    }

    return errors;
}