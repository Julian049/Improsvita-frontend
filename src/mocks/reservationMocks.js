// SUPUESTO: datos de prueba de reservas. El backend todavía no tiene este módulo.
// clientId 1 y 2 coinciden con los contactos de data-dev.sql del backend.
export const MOCK_RESERVATIONS = [
    { reservationId: 'r-1', clientId: 1, sowingId: 1, quantity: 200, reservationDate: '2026-10-20', deliveryDate: '2026-11-05', status: 'RESERVED' },
    { reservationId: 'r-2', clientId: 2, sowingId: 3, quantity: 100, reservationDate: '2026-10-10', deliveryDate: '2026-10-18', status: 'DELIVERED' },
    { reservationId: 'r-3', clientId: 2, sowingId: 1, quantity: 150, reservationDate: '2026-10-15', deliveryDate: '2026-10-22', status: 'RESERVED' },
    { reservationId: 'r-4', clientId: 1, sowingId: 2, quantity: 300, reservationDate: '2026-10-24', deliveryDate: '2026-10-27', status: 'RESERVED' },
    { reservationId: 'r-5', clientId: 1, sowingId: 3, quantity: 80, reservationDate: '2026-10-25', deliveryDate: '2026-10-26', status: 'RESERVED' },
    { reservationId: 'r-6', clientId: 2, sowingId: 2, quantity: 120, reservationDate: '2026-10-01', deliveryDate: '2026-10-12', status: 'DELIVERED' },
    { reservationId: 'r-7', clientId: 1, sowingId: 1, quantity: 50, reservationDate: '2026-10-05', deliveryDate: '2026-10-15', status: 'CANCELLED' },
];
