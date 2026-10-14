import { toLocalDate } from '../../utils/dateUtils';

export const LOT_FIELD_LABELS = {
    seedId: 'Semilla',
    supplierId: 'Proveedor',
    locationId: 'Ubicación',
    lotNumber: 'Número de lote',
    quantity: 'Cantidad',
    germinationPercentage: 'Germinación (%)',
    entryDate: 'Fecha de ingreso',
};

// Campos sin los que POST /inventory/entries falla; la fecha de ingreso es opcional.
export const LOT_REQUIRED_FIELDS = ['seedId', 'supplierId', 'locationId', 'lotNumber', 'quantity'];
export const LOT_EDIT_REQUIRED_FIELDS = ['locationId', 'lotNumber'];

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

export function validateLotForm(values, requiredFields = LOT_REQUIRED_FIELDS) {
    const errors = {};

    requiredFields.forEach((field) => {
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
        if (!Number.isInteger(quantity) || quantity <= 0) {
            errors.quantity = 'La cantidad debe ser un número entero mayor que cero.';
        }
    }

    if (!isEmpty(values.germinationPercentage)) {
        const percent = Number(values.germinationPercentage);
        if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
            errors.germinationPercentage = 'La germinación debe ser un entero entre 1 y 100.';
        }
    }

    if (!isEmpty(values.entryDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (toLocalDate(values.entryDate) > today) {
            errors.entryDate = 'La fecha de ingreso no puede ser mayor a la actual.';
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
    germinationPercentage: '',
    entryDate: '',
};
