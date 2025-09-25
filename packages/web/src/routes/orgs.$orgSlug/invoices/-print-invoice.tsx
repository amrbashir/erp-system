import { InvoiceWithRelations } from "@erp-system/server/invoice/invoice.dto";

import i18n from "@/i18n.ts";
import { formatDate } from "@/utils/formatDate.ts";

export function printInvoice(invoice: InvoiceWithRelations, i18nInstance = i18n) {
  const t = i18nInstance.t;

  const HTML = `<!DOCTYPE html>
<html lang="${i18nInstance.language}" dir="${i18nInstance.dir()}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t("routes.invoicePrint")} #${invoice.id}</title>
  <style>
  body {
    font-family: Arial, sans-serif;
    print-color-adjust: exact;
  }

  h1 {
    text-align: center;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  table, th, td {
    border: 1px solid #aaa;
  }

  th, td {
    padding: 4px;
  }

  th {
    text-wrap: nowrap;
    background-color: #ccc;
    font-weight: bold;
  }

  th + td {
    width: 100%;
  }

  th + td:has(+ td:last-child) {
    width: 50%;
  }
  </style>
</head>
<body>
  <h1>${invoice.organization?.name ?? "erp-system"}</h1>

  <table>
    <tr>
      <th>${t("invoice.number")}</th>
      <td>${invoice.id}</td>
    </tr>
    <tr>
      <th>${t("customer.name")}</th>
      <td>${invoice.customer?.name ?? ""}</td>
    </tr>
    <tr>
      <th>${t("customer.id")}</th>
      <td>${invoice.customer?.id ?? ""}</td>
    </tr>
    <tr>
      <th>${t("common.dates.date")}</th>
      <td>${formatDate(invoice.createdAt)}</td>
    </tr>
  </table>
  <table>
    <thead>
      <tr>
        <th>${t("common.ui.number")}</th>
        <th style="width: 100%">${t("common.form.description")}</th>
        <th>${t("common.form.quantity")}</th>
        <th>${t("common.form.price")}</th>
        <th colSpan="2">${t("common.form.discount")} (%)</th>
        <th>${t("common.form.total")}</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.price}</td>
        <td>${item.discountAmount}</td>
        <td>${item.discountPercent} %</td>
        <td>${item.total}</td>
      </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
  <table>
    <tr>
      <th>${t("common.form.subtotal")}</th>
      <td colSpan="2">${invoice.subtotal}</td>
    </tr>
    <tr>
      <th>${t("common.form.discount")} (%)</th>
      <td>${invoice.discountAmount}</td>
      <td>${invoice.discountPercent} %</td>

    </tr>
    <tr>
      <th>${t("common.form.total")}</th>
      <td colSpan="2">${invoice.total}</td>
    </tr>
    <tr>
      <th>${t("common.form.paid")}</th>
      <td colSpan="2">${invoice.paid}</td>
    </tr>
    <tr>
      <th>${t("common.form.remaining")}</th>
      <td colSpan="2">${invoice.remaining}</td>
    </tr>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(HTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  } else {
    console.error("Failed to open print window");
  }
}
