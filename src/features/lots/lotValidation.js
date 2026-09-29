import { toLocalDate } from '../../utils/dateUtils';

export const LOT_FIELD_LABELS = {
    seedId: 'Semilla',
    locationId: 'Ubicación',
    lotNumber: 'Número de lote',
    entryDate: 'Fecha de ingreso',
    dueDate: 'Fecha de vencimiento',
    initialQuantity: 'Cantidad inicial',
};

export const LOT_STATUS_LABELS = {};

export function getLotStatusLabel(status) {
    return LOT_STATUS_LABELS[status] || status || '—';
}

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

export function validateLotForm(values) {
    const errors = {};

    Object.keys(LOT_FIELD_LABELS).forEach((field) => {
        if (isEmpty(values[field])) errors[field] = 'Este campo es obligatorio.';
    });

    if (!isEmpty(values.lotNumber)) {
        const lotNumber = Number(values.lotNumber);
        if (!Number.isInteger(lotNumber) || lotNumber <= 0) {
            errors.lotNumber = 'El número de lote debe ser un entero mayor que cero.';
        }
    }

    if (!isEmpty(values.initialQuantity)) {
        const quantity = Number(values.initialQuantity);
        if (Number.isNaN(quantity) || quantity <= 0) {
            errors.initialQuantity = 'La cantidad debe ser un número válido y mayor que cero.';
        }
    }

    if (!isEmpty(values.entryDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (toLocalDate(values.entryDate) > today) {
            errors.entryDate = 'La fecha de ingreso no puede ser mayor a la actual.';
        }
    }

    if (!isEmpty(values.dueDate) && !isEmpty(values.entryDate)) {
        if (toLocalDate(values.dueDate) < toLocalDate(values.entryDate)) {
            errors.dueDate = 'La fecha de vencimiento no puede ser menor a la fecha de ingreso.';
        }
    }

    return errors;
}

export const LOT_FORM_INITIAL_VALUES = {
    seedId: '',
    locationId: '',
    lotNumber: '',
    entryDate: '',
    dueDate: '',
    initialQuantity: '',
};