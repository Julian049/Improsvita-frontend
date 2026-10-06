export const formatQty = (val, unit = '') => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0';
    const formatted = Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return unit ? `${formatted} ${unit}` : formatted;
};