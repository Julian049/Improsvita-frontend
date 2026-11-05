import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Abre el comprobante en otra pestaña y lanza el diálogo de impresión (ahí se guarda como PDF).
export function printReceipt(entry) {
    const rows = [
        ['Tipo', entry.typeLabel],
        ['Fecha', formatDate(entry.date)],
        ['Cliente', entry.clientName],
        ['Siembra', entry.plantName],
        ['Cantidad', entry.quantity != null ? formatQty(entry.quantity) : '—'],
        ['Total', `$ ${formatQty(entry.totalPrice)}`],
        ['Notas', entry.notes || '—'],
    ];
    const body = rows
        .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
        .join('');

    const win = window.open('', '_blank');
    if (!win) return false; // el navegador bloqueó la ventana emergente
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Comprobante ${escapeHtml(entry.reference)}</title>
<style>body{font-family:sans-serif;max-width:560px;margin:32px auto;color:#1f2937}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}
th{width:35%;color:#6b7280}</style></head><body>
<h1>Improsvita</h1><h2>Comprobante ${escapeHtml(entry.reference)}</h2>
<table>${body}</table></body></html>`);
    win.document.close();
    win.focus();
    win.print();
    return true;
}
