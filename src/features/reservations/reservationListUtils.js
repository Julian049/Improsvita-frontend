const normalize = (text) =>
    String(text ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

export function filterReservations(reservations, query) {
    const needle = normalize(query.trim());
    if (!needle) return reservations;
    return reservations.filter((reservation) =>
        normalize(`${reservation.clientName} ${reservation.plantName}`).includes(needle)
    );
}

export function sortByReservationDate(reservations) {
    return [...reservations].sort((a, b) =>
        String(a.reservationDate).localeCompare(String(b.reservationDate))
    );
}
