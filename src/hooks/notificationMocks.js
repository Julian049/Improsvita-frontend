// Helper para calcular fechas relativas a hoy (YYYY-MM-DD)
function getRelativeDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

export const MOCK_NOTIFICATION_ALERTS = [
    {
        lotId: 101,
        seedName: 'Tomate Cherry',
        lotNumber: 12,
        dueDate: getRelativeDate(-5), // Vencido hace 5 días
        availableQuantity: 45,
        expiration: {
            level: 'expired',
            label: 'Vencido hace 5 días',
        },
    },
    {
        lotId: 102,
        seedName: 'Lechuga Crespa',
        lotNumber: 8,
        dueDate: getRelativeDate(-12), // Vencido hace 12 días
        availableQuantity: 20,
        expiration: {
            level: 'expired',
            label: 'Vencido hace 12 días',
        },
    },
    {
        lotId: 103,
        seedName: 'Pimentón California',
        lotNumber: 15,
        dueDate: getRelativeDate(2), // Crítico: vence en 2 días
        availableQuantity: 120,
        expiration: {
            level: 'critical',
            label: 'Vence en 2 días',
        },
    },
    {
        lotId: 104,
        seedName: 'Cilantro Común',
        lotNumber: 21,
        dueDate: getRelativeDate(5), // Crítico: vence en 5 días
        availableQuantity: 80,
        expiration: {
            level: 'critical',
            label: 'Vence en 5 días',
        },
    },
    {
        lotId: 105,
        seedName: 'Zanahoria Nantesa',
        lotNumber: 30,
        dueDate: getRelativeDate(12), // Próximo: vence en 12 días
        availableQuantity: 200,
        expiration: {
            level: 'warning',
            label: 'Vence en 12 días',
        },
    },
];