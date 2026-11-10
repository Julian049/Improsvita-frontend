import { getTodayDateString } from '../sowings/sowingUtils';

export const SALE_FIELD_LABELS = {
    clientId: 'Cliente',
    sowingId: 'Siembra',
    quantity: 'Cantidad',
    unitPrice: 'Precio unitario',
    saleDate: 'Fecha de venta',
};

// available: plántulas de la siembra elegida (null si no se conoce).
export function validateSaleForm(values, available) {
    const errors = {};

    Object.keys(SALE_FIELD_LABELS).forEach((field) => {
        if (String(values[field] ?? '').trim() === '') {
            errors[field] = 'Este campo es obligatorio.';
        }
    });

    if (!errors.quantity) {
        const quantity = Number(values.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            errors.quantity = 'La cantidad debe ser un entero mayor a 0.';
        } else if (available != null && quantity > available) {
            errors.quantity = `Solo hay ${available} plántulas disponibles en esta siembra.`;
        }
    }

    if (!errors.unitPrice) {
        const raw = String(values.unitPrice).trim();
        const unitPrice = Number(raw);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            errors.unitPrice = 'El precio unitario debe ser un número mayor o igual a 0.';
        } else if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
            errors.unitPrice = 'El precio unitario admite como máximo dos decimales.';
        }
    }

    return errors;
}

export function getSaleFormInitialValues() {
    return {
        clientId: '',
        sowingId: '',
        quantity: '',
        unitPrice: '',
        saleDate: getTodayDateString(),
        notes: '',
    };
}
