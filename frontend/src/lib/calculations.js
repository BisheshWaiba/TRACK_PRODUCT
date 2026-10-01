// Pure business-logic functions, deliberately free of React state and
// Supabase calls so they can be unit tested in isolation. DataContext
// wraps each of these with the live products/sales/payments arrays.

export function productById(products, id) {
  return products.find((p) => p.id === id);
}

export function customerById(customers, id) {
  return customers.find((c) => c.id === id);
}

export function saleTotal(sale, products) {
  if (sale.unitPrice != null) return Number(sale.unitPrice) * sale.qty;
  const product = productById(products, sale.productId);
  return product ? product.price * sale.qty : 0;
}

export function salePaidAmount(payments, saleId) {
  return payments.filter((p) => p.saleId === saleId).reduce((sum, p) => sum + p.amount, 0);
}

export function salePaymentStatus(sale, products, payments) {
  const total = saleTotal(sale, products);
  const paid = salePaidAmount(payments, sale.id);
  if (paid <= 0) return "Pending";
  if (paid < total) return "Partial";
  return "Paid";
}

export function invoiceTotal(invoice, sales, products) {
  if (invoice?.total != null) return Number(invoice.total);
  return sales.filter((sale) => sale.invoiceId === invoice?.id).reduce((sum, sale) => sum + saleTotal(sale, products), 0);
}

export function invoicePaidAmount(payments, invoiceId, sales = []) {
  const saleIds = new Set(sales.filter((sale) => sale.invoiceId === invoiceId).map((sale) => sale.id));
  return payments
    .filter((payment) => payment.invoiceId === invoiceId || (!payment.invoiceId && saleIds.has(payment.saleId)))
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function invoicePaymentStatus(invoice, sales, products, payments) {
  const total = invoiceTotal(invoice, sales, products);
  const paid = invoicePaidAmount(payments, invoice.id, sales);
  if (paid <= 0) return "Pending";
  if (paid < total) return "Partial";
  return "Paid";
}

export function invoiceLines(invoiceId, sales) {
  return sales.filter((sale) => sale.invoiceId === invoiceId);
}

export function groupSalesByInvoice(sales, invoices = []) {
  const byId = new Map(invoices.map((invoice) => [invoice.id, { ...invoice, lines: [] }]));
  for (const sale of sales) {
    if (sale.invoiceId && byId.has(sale.invoiceId)) byId.get(sale.invoiceId).lines.push(sale);
    else byId.set(sale.id, { id: sale.id, date: sale.date, customerId: sale.customerId, lines: [sale], legacy: true });
  }
  return [...byId.values()].filter((invoice) => invoice.lines.length > 0);
}

export function salesForCustomer(sales, customerId) {
  return sales.filter((s) => s.customerId === customerId);
}

export function getCustomerStats(customerId, sales, products, payments, invoices = []) {
  const custSales = salesForCustomer(sales, customerId);
  const invoiceGroups = groupSalesByInvoice(custSales, invoices);
  const totalPurchases = invoiceGroups.reduce((sum, invoice) => sum + (invoice.legacy ? saleTotal(invoice.lines[0], products) : invoiceTotal(invoice, custSales, products)), 0);
  const totalPaid = invoiceGroups.reduce((sum, invoice) => sum + (invoice.legacy ? salePaidAmount(payments, invoice.lines[0].id) : invoicePaidAmount(payments, invoice.id, custSales)), 0);
  const unitsTaken = custSales.reduce((sum, s) => sum + s.qty, 0);
  return { totalPurchases, totalPaid, outstanding: totalPurchases - totalPaid, unitsTaken };
}

export function stockStatus(product) {
  const available = product.stockTotal - product.stockTaken;
  if (available <= 0) return { label: "Out of Stock", tone: "ink" };
  if (available <= product.reorderAt) return { label: "Low Stock", tone: "danger" };
  if (available <= product.reorderAt * 2) return { label: "Selling Fast", tone: "accent" };
  return { label: "In Stock", tone: "teal" };
}

export function dashboardTotals(products, customers, sales, payments, invoices = []) {
  const totalStock = products.reduce((s, p) => s + p.stockTotal, 0);
  const totalTaken = products.reduce((s, p) => s + p.stockTaken, 0);
  const totalAvailable = totalStock - totalTaken;
  const lowStock = products.filter((p) => {
    const a = p.stockTotal - p.stockTaken;
    return a > 0 && a <= p.reorderAt;
  }).length;
  const outOfStock = products.filter((p) => p.stockTotal - p.stockTaken <= 0).length;
  const totalSales = groupSalesByInvoice(sales, invoices).reduce((sum, invoice) => sum + (invoice.legacy ? saleTotal(invoice.lines[0], products) : invoiceTotal(invoice, invoice.lines, products)), 0);
  const amountReceived = payments.reduce((s, p) => s + p.amount, 0);
  const pendingPayments = totalSales - amountReceived;
  return {
    totalProducts: products.length,
    totalStock,
    totalTaken,
    totalAvailable,
    lowStock,
    outOfStock,
    totalSales,
    amountReceived,
    pendingPayments,
    activeCustomers: customers.length,
  };
}
