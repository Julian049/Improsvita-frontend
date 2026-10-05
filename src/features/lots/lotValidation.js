import { toLocalDate } from '../../utils/dateUtils';

export const LOT_FIELD_LABELS = {
    seedId: 'Semilla',
    supplierId: 'Proveedor',
    locationId: 'Ubicación',
    lotNumber: 'Número de lote',
    quantity: 'Cantidad',
    entryDate: 'Fecha de ingreso',
    dueDate: 'Fecha de vencimiento',
};

// Campos sin los que POST /inventory/entries falla; las fechas son opcionales.
export const LOT_REQUIRED_FIELDS = ['seedId', 'supplierId', 'locationId', 'lotNumber', 'quantity'];

export const LOT_STATUS_LABELS = {
    AVAILABLE: 'Disponible',
    DEPLETED: 'Agotado',
    EXPIRED: 'Vencido',
    DISCARDED: 'Descartado',
};

export function getLotStatusLabel(status) {
    return LOT_STATUS_LABELS[status] || status || '—';
}

function isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

export function validateLotForm(values) {
    const errors = {};

    LOT_REQUIRED_FIELDS.forEach((field) => {
        if (isEmpty(values[field])) errors[field] = 'Este campo es obligatorio.';
    });

    if (!isEmpty(values.lotNumber)) {
        const lotNumber = Number(values.lotNumber);
        if (!Number.isInteger(lotNumber) || lotNumber <= 0) {
            errors.lotNumber = 'El número de lote debe ser un entero mayor que cero.';
        }
    }

    if (!isEmpty(values.quantity)) {
        const quantity = Number(values.quantity);
        if (Number.isNaN(quantity) || quantity <= 0) {
            errors.quantity = 'La cantidad debe ser un número válido y mayor que cero.';
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
    supplierId: '',
    locationId: '',
    lotNumber: '',
    quantity: '',
    entryDate: '',
    dueDate: '',
};
