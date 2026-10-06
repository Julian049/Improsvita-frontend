const MS_PER_DAY = 864e5;

export const daysUntil = (dateValue) => {
    if (!dateValue) return null;
    const target = new Date(`${String(dateValue).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Math.round((target - today) / MS_PER_DAY);
};