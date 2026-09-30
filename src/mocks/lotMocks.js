function getRelativeDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

export const MOCK_LOTS = [
    { lotId: 'l-1', seedId: 's-101', lotNumber: 12, dueDate: getRelativeDate(-5), availableQuantity: 45 },
    { lotId: 'l-2', seedId: 's-102', lotNumber: 8, dueDate: getRelativeDate(-12), availableQuantity: 20 },
    { lotId: 'l-3', seedId: 's-103', lotNumber: 15, dueDate: getRelativeDate(2), availableQuantity: 120 },
    { lotId: 'l-4', seedId: 's-104', lotNumber: 21, dueDate: getRelativeDate(5), availableQuantity: 80 },
    { lotId: 'l-5', seedId: 's-105', lotNumber: 30, dueDate: getRelativeDate(12), availableQuantity: 200 },
];