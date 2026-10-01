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

export function salesForCustomer(sales, customerId) {
  return sales.filter((s) => s.customerId === customerId);
}

export function getCustomerStats(customerId, sales, products, payments) {
  const custSales = salesForCustomer(sales, customerId);
  const totalPurchases = custSales.reduce((sum, s) => sum + saleTotal(s, products), 0);
  const totalPaid = custSales.reduce((sum, s) => sum + salePaidAmount(payments, s.id), 0);
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

export function dashboardTotals(products, customers, sales, payments) {
  const totalStock = products.reduce((s, p) => s + p.stockTotal, 0);
  const totalTaken = products.reduce((s, p) => s + p.stockTaken, 0);
  const totalAvailable = totalStock - totalTaken;
  const lowStock = products.filter((p) => {
    const a = p.stockTotal - p.stockTaken;
    return a > 0 && a <= p.reorderAt;
  }).length;
  const outOfStock = products.filter((p) => p.stockTotal - p.stockTaken <= 0).length;
  const totalSales = sales.reduce((s, sale) => s + saleTotal(sale, products), 0);
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
