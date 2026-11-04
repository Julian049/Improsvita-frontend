export const CONTACT_ROLE_OPTIONS = [
    { value: 'CLIENT', label: 'Cliente', hint: 'Puede registrar reservas.' },
    { value: 'SUPPLIER', label: 'Proveedor', hint: 'Suministra semillas y lotes.' },
    { value: 'EMPLOYEE', label: 'Empleado', hint: 'Personal interno de la empresa.' },
];

export const CONTACT_ROLE_LABELS = Object.fromEntries(
    CONTACT_ROLE_OPTIONS.map((role) => [role.value, role.label])
);

export function getRoleLabel(role) {
    return CONTACT_ROLE_LABELS[role] || role;
}
