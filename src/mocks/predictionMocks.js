// SUPUESTO: predicción simulada. El backend todavía no tiene este módulo.
// Determinista (misma semilla y fechas dan las mismas cifras) para que las pruebas sean repetibles.
export function buildMockPrediction({ seedId, from, to }) {
    const [fromYear, fromMonth] = from.split('-').map(Number);
    const [toYear, toMonth] = to.split('-').map(Number);
    const months = [];

    for (let index = fromYear * 12 + fromMonth - 1; index <= toYear * 12 + toMonth - 1; index += 1) {
        const year = Math.floor(index / 12);
        const month = (index % 12) + 1;
        months.push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            units: 100 + (((Number(seedId) || 1) * 7919 + index * 104729) % 400),
        });
    }

    return { seedId, from, to, months, total: months.reduce((sum, row) => sum + row.units, 0) };
}
