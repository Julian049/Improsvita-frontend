import { getTodayDateString } from '../sowings/sowingUtils';

export const SALE_FIELD_LABELS = {
    clientId: 'Cliente',
    sowingId: 'Siembra',
    quantity: 'Cantidad',
    totalPrice: 'Precio total',
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

    if (!errors.totalPrice) {
        const totalPrice = Number(values.totalPrice);
        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            errors.totalPrice = 'El precio total debe ser un número mayor o igual a 0.';
        }
    }

    return errors;
}

export function getSaleFormInitialValues() {
    return {
        clientId: '',
        sowingId: '',
        quantity: '',
        totalPrice: '',
        saleDate: getTodayDateString(),
        notes: '',
    };
}
