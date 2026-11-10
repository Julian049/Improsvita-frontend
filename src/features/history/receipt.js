import { formatDate } from '../../utils/dateUtils';
import { formatQty } from '../../utils/numberUtils';

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const formatMoney = (value) => `$ ${formatQty(value)}`;

function buildReceiptHtml(entry, logoUrl) {
    const total = Number(entry.totalPrice) || 0;
    const hasQuantity = entry.quantity != null;
    const unitPrice =
        entry.unitPrice != null
            ? Number(entry.unitPrice)
            : hasQuantity && Number(entry.quantity) > 0
              ? total / Number(entry.quantity)
              : null;

    const description = hasQuantity
        ? entry.plantName
        : `${entry.typeLabel} · ${entry.plantName}`;

    const generatedAt = new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date());

    const meta = [
        ['Cliente', entry.clientName],
        ['Tipo', entry.typeLabel],
        ['Fecha', formatDate(entry.date)],
        ['Siembra', entry.plantName],
    ]
        .map(
            ([label, value]) => `
                <div class="meta-item">
                    <span>${escapeHtml(label)}</span>
                    <strong>${escapeHtml(value)}</strong>
                </div>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Comprobante ${escapeHtml(entry.reference)} · Improsvita</title>
<style>
    :root {
        color-scheme: light;
        --ink: #17211b;
        --muted: #67756c;
        --line: #dde5e0;
        --soft: #f7faf8;
        --green: #1f6b45;
        --green-soft: #e7f2ec;
        --gold: #b9852f;
    }

    * { box-sizing: border-box; }

    body {
        margin: 0;
        padding: 32px 16px;
        background: #eef2f0;
        color: var(--ink);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .toolbar {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        max-width: 760px;
        margin: 0 auto 14px;
    }

    .toolbar button {
        padding: 9px 14px;
        border: 1px solid #cfdad3;
        border-radius: 8px;
        background: #ffffff;
        color: var(--ink);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
    }

    .toolbar button.primary {
        border-color: var(--green);
        background: var(--green);
        color: #ffffff;
    }

    .sheet {
        max-width: 760px;
        margin: 0 auto;
        padding: 44px 48px 36px;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 30px 80px -48px rgba(15, 23, 18, 0.55);
    }

    .doc-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--line);
    }

    .doc-brand {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .doc-brand img {
        width: 54px;
        height: 54px;
        object-fit: contain;
        padding: 5px;
        border: 1px solid var(--line);
        border-radius: 14px;
    }

    .doc-brand strong {
        display: block;
        font-size: 18px;
        letter-spacing: -0.01em;
    }

    .doc-brand span {
        display: block;
        color: var(--muted);
        font-size: 12px;
    }

    .doc-stamp {
        text-align: right;
    }

    .doc-stamp span {
        display: block;
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .doc-stamp strong {
        display: block;
        margin: 2px 0;
        color: var(--green);
        font-size: 16px;
    }

    .doc-stamp small {
        display: block;
        color: var(--muted);
        font-size: 11px;
    }

    .doc-title {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        margin: 30px 0 22px;
    }

    .doc-kicker {
        display: block;
        margin-bottom: 4px;
        color: var(--green);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .doc-title h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.1;
        letter-spacing: -0.025em;
    }

    .doc-status {
        padding: 5px 11px;
        border: 1px solid #bcdacb;
        border-radius: 999px;
        background: var(--green-soft);
        color: var(--green);
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
    }

    .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 22px;
        padding: 18px 20px;
        background: var(--soft);
        border: 1px solid var(--line);
        border-radius: 12px;
    }

    .meta-item span {
        display: block;
        margin-bottom: 2px;
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
    }

    .meta-item strong {
        display: block;
        font-size: 13.5px;
        font-weight: 600;
    }

    table {
        width: 100%;
        margin-top: 24px;
        border-collapse: collapse;
    }

    thead th {
        padding: 10px 12px;
        background: var(--soft);
        border-bottom: 1px solid var(--line);
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-align: left;
        text-transform: uppercase;
    }

    thead th.num,
    tbody td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    tbody td {
        padding: 15px 12px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
    }

    tbody td strong {
        display: block;
        font-weight: 600;
    }

    tbody td small {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 11.5px;
    }

    .total-box {
        display: flex;
        justify-content: flex-end;
        margin-top: 18px;
    }

    .total-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        min-width: 280px;
        padding: 14px 18px;
        border: 1px solid #bcdacb;
        border-radius: 12px;
        background: var(--green-soft);
    }

    .total-inner span {
        color: var(--green);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .total-inner strong {
        color: var(--green);
        font-size: 22px;
        letter-spacing: -0.02em;
    }

    .notes {
        margin-top: 24px;
        padding: 14px 16px;
        border-left: 3px solid var(--gold);
        border-radius: 0 10px 10px 0;
        background: #fffaf0;
    }

    .notes span {
        display: block;
        margin-bottom: 3px;
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
    }

    .notes p {
        margin: 0;
        font-size: 13px;
    }

    .signatures {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 40px;
        margin-top: 56px;
    }

    .signature {
        padding-top: 10px;
        border-top: 1px solid #9aa79f;
        color: var(--muted);
        font-size: 11px;
        text-align: center;
    }

    .doc-footer {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 34px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 10.5px;
    }

    @page {
        size: A4;
        margin: 16mm;
    }

    @media print {
        body {
            padding: 0;
            background: #ffffff;
        }

        .toolbar {
            display: none;
        }

        .sheet {
            max-width: none;
            margin: 0;
            padding: 0;
            border: 0;
            border-radius: 0;
            box-shadow: none;
        }
    }

    @media (max-width: 620px) {
        .sheet { padding: 26px 20px; }
        .doc-header { flex-direction: column; }
        .doc-stamp { text-align: left; }
        .meta-grid { grid-template-columns: 1fr; }
        .doc-title { align-items: flex-start; flex-direction: column; }
        .total-inner { min-width: 0; width: 100%; }
        .signatures { gap: 20px; }
        .doc-footer { flex-direction: column; gap: 4px; }
    }
</style>
</head>
<body>
    <div class="toolbar">
        <button type="button" onclick="window.print()" class="primary">Imprimir / Guardar PDF</button>
        <button type="button" onclick="window.close()">Cerrar</button>
    </div>

    <main class="sheet">
        <header class="doc-header">
            <div class="doc-brand">
                <img src="${escapeHtml(logoUrl)}" alt="Improscol">
                <div>
                    <strong>Improsvita</strong>
                    <span>Gestión de vivero · Improscol</span>
                </div>
            </div>
            <div class="doc-stamp">
                <span>Comprobante</span>
                <strong>${escapeHtml(entry.reference)}</strong>
                <small>Generado el ${escapeHtml(generatedAt)}</small>
            </div>
        </header>

        <div class="doc-title">
            <div>
                <span class="doc-kicker">Documento de venta</span>
                <h1>Comprobante de venta</h1>
            </div>
            <span class="doc-status">Registrado</span>
        </div>

        <section class="meta-grid" aria-label="Datos del comprobante">
            ${meta}
        </section>

        <table>
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th class="num">Cantidad</th>
                    <th class="num">Precio unitario</th>
                    <th class="num">Importe</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>${escapeHtml(description)}</strong>
                        <small>${escapeHtml(entry.typeLabel)}</small>
                    </td>
                    <td class="num">${hasQuantity ? `${escapeHtml(formatQty(entry.quantity))} plántulas` : '—'}</td>
                    <td class="num">${unitPrice != null && Number.isFinite(unitPrice) ? escapeHtml(formatMoney(unitPrice)) : '—'}</td>
                    <td class="num">${escapeHtml(formatMoney(total))}</td>
                </tr>
            </tbody>
        </table>

        <div class="total-box">
            <div class="total-inner">
                <span>Total</span>
                <strong>${escapeHtml(formatMoney(total))}</strong>
            </div>
        </div>

        <section class="notes">
            <span>Observaciones</span>
            <p>${escapeHtml(entry.notes || 'Sin observaciones adicionales.')}</p>
        </section>

        <div class="signatures">
            <div class="signature">Firma del responsable</div>
            <div class="signature">Recibido por</div>
        </div>

        <footer class="doc-footer">
            <span>Improsvita · Improscol</span>
            <span>Documento de control interno generado electrónicamente.</span>
        </footer>
    </main>
</body>
</html>`;
}

export function printReceipt(entry) {
    const win = window.open('', '_blank');
    if (!win) return false;

    const base = import.meta.env.BASE_URL || '/';
    const logoUrl = new URL(`${base}improscol-icon.png`, window.location.origin).href;

    win.document.write(buildReceiptHtml(entry, logoUrl));
    win.document.close();
    win.focus();

    const print = () => setTimeout(() => win.print(), 150);
    if (win.document.readyState === 'complete') {
        print();
    } else {
        win.addEventListener('load', print, { once: true });
    }

    return true;
}
