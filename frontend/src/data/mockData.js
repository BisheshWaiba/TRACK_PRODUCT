// Mock data layer — stands in for the real API until the backend is built.
// Every derived number (stock available, customer balances, dashboard totals)
// is computed from these base arrays so the app stays internally consistent.

export const products = [
  {
    id: "grocery-a",
    name: "Grocery Bundle A",
    category: "Grocery",
    price: 8450,
    bundleSize: "4 items / bundle",
    items: ["Rice × 5", "Oil × 3", "Noodles × 10", "Sugar × 2"],
    stockTotal: 200,
    stockTaken: 152,
    reorderAt: 40,
  },
  {
    id: "stationery-b",
    name: "Stationery Bundle B",
    category: "Stationery",
    price: 4200,
    bundleSize: "3 items / bundle",
    items: ["Notebooks × 20", "Pens × 50", "Pencils × 30"],
    stockTotal: 150,
    stockTaken: 90,
    reorderAt: 30,
  },
  {
    id: "hardware-c",
    name: "Hardware Bundle C",
    category: "Hardware",
    price: 6900,
    bundleSize: "3 items / bundle",
    items: ["Nails × 5kg", "Rope × 10m", "Tape × 15"],
    stockTotal: 100,
    stockTaken: 82,
    reorderAt: 20,
  },
  {
    id: "dairy-d",
    name: "Dairy Bundle D",
    category: "Dairy",
    price: 11300,
    bundleSize: "3 items / bundle",
    items: ["Milk Powder × 10", "Ghee × 5", "Paneer × 8"],
    stockTotal: 120,
    stockTaken: 40,
    reorderAt: 25,
  },
  {
    id: "cleaning-e",
    name: "Cleaning Supplies Bundle E",
    category: "Household",
    price: 5600,
    bundleSize: "3 items / bundle",
    items: ["Detergent × 12", "Floor Cleaner × 6", "Mop × 3"],
    stockTotal: 180,
    stockTaken: 130,
    reorderAt: 35,
  },
  {
    id: "electronics-f",
    name: "Electronics Accessories Bundle F",
    category: "Electronics",
    price: 9750,
    bundleSize: "3 items / bundle",
    items: ["Cables × 20", "Chargers × 15", "Batteries × 30"],
    stockTotal: 90,
    stockTaken: 85,
    reorderAt: 15,
  },
  {
    id: "winter-g",
    name: "Winter Essentials Bundle G",
    category: "Seasonal",
    price: 15200,
    bundleSize: "3 items / bundle",
    items: ["Blankets × 10", "Heaters × 2", "Socks × 20"],
    stockTotal: 60,
    stockTaken: 60,
    reorderAt: 10,
  },
];

export const customers = [
  {
    id: "him-traders",
    name: "Him Traders",
    contact: "Anita Sharma",
    phone: "981-2345678",
    address: "Bagar Road, Pokhara",
    city: "Pokhara",
    joined: "2026-01-14",
  },
  {
    id: "gorkha-mart",
    name: "Gorkha Mart",
    contact: "Bikash Gurung",
    phone: "984-1122334",
    address: "New Road, Hetauda",
    city: "Hetauda",
    joined: "2026-02-02",
  },
  {
    id: "bagmati-traders",
    name: "Bagmati Traders",
    contact: "Rita Maharjan",
    phone: "980-7788990",
    address: "Thapathali, Kathmandu",
    city: "Kathmandu",
    joined: "2025-11-20",
  },
  {
    id: "pokhara-retail",
    name: "Pokhara Retail Co.",
    contact: "Sunil Adhikari",
    phone: "986-5544332",
    address: "Lakeside, Pokhara",
    city: "Pokhara",
    joined: "2026-03-05",
  },
  {
    id: "annapurna-store",
    name: "Annapurna Store",
    contact: "Krishna Bhattarai",
    phone: "982-3321445",
    address: "Lakeside, Pokhara",
    city: "Pokhara",
    joined: "2026-04-18",
  },
];

// Every sale a customer has placed. `paidAmount` is a snapshot kept in sync
// with the `payments` log below (see getCustomerStats).
export const sales = [
  { id: "SL-1042", date: "2026-09-24", customerId: "him-traders", productId: "grocery-a", qty: 2, status: "In Transit" },
  { id: "SL-1041", date: "2026-09-23", customerId: "gorkha-mart", productId: "hardware-c", qty: 5, status: "Packing" },
  { id: "SL-1040", date: "2026-09-22", customerId: "bagmati-traders", productId: "dairy-d", qty: 3, status: "Order Placed" },
  { id: "SL-1038", date: "2026-09-20", customerId: "annapurna-store", productId: "winter-g", qty: 8, status: "Order Placed" },
  { id: "SL-1035", date: "2026-09-18", customerId: "pokhara-retail", productId: "grocery-a", qty: 3, status: "Delivered" },
  { id: "SL-1029", date: "2026-09-12", customerId: "him-traders", productId: "hardware-c", qty: 10, status: "Delivered" },
  { id: "SL-1024", date: "2026-09-04", customerId: "him-traders", productId: "stationery-b", qty: 15, status: "Delivered" },
  { id: "SL-1018", date: "2026-08-29", customerId: "bagmati-traders", productId: "grocery-a", qty: 2, status: "Delivered" },
  { id: "SL-1010", date: "2026-08-20", customerId: "gorkha-mart", productId: "cleaning-e", qty: 10, status: "Delivered" },
  { id: "SL-1002", date: "2026-08-05", customerId: "pokhara-retail", productId: "stationery-b", qty: 8, status: "Delivered" },
];

// Individual payment transactions against a sale. A sale with no entries
// here is fully pending; entries summing to less than the sale total mean
// it is partially paid.
export const payments = [
  { id: "PM-501", date: "2026-09-24", saleId: "SL-1042", amount: 16900, method: "Cash on Delivery" },
  { id: "PM-500", date: "2026-09-23", saleId: "SL-1041", amount: 20000, method: "Bank Transfer" },
  { id: "PM-495", date: "2026-09-18", saleId: "SL-1035", amount: 25350, method: "Cash on Delivery" },
  { id: "PM-490", date: "2026-09-12", saleId: "SL-1029", amount: 69000, method: "Bank Transfer" },
  { id: "PM-486", date: "2026-09-04", saleId: "SL-1024", amount: 63000, method: "Bank Transfer" },
  { id: "PM-480", date: "2026-08-29", saleId: "SL-1018", amount: 16900, method: "Cash on Delivery" },
  { id: "PM-475", date: "2026-08-21", saleId: "SL-1010", amount: 56000, method: "Bank Transfer" },
  { id: "PM-470", date: "2026-08-05", saleId: "SL-1002", amount: 33600, method: "Digital Wallet" },
];

export const stockMovements = [
  { id: "SM-220", date: "2026-09-29", productId: "grocery-a", type: "in", qty: 100, reference: "Supplier restock #RS-118" },
  { id: "SM-219", date: "2026-09-24", productId: "grocery-a", type: "out", qty: 2, reference: "Sale — SL-1042" },
  { id: "SM-218", date: "2026-09-23", productId: "hardware-c", type: "out", qty: 5, reference: "Sale — SL-1041" },
  { id: "SM-217", date: "2026-09-20", productId: "winter-g", type: "out", qty: 8, reference: "Sale — SL-1038" },
  { id: "SM-216", date: "2026-09-18", productId: "dairy-d", type: "in", qty: 40, reference: "Supplier restock #RS-112" },
  { id: "SM-215", date: "2026-09-12", productId: "hardware-c", type: "out", qty: 10, reference: "Sale — SL-1029" },
  { id: "SM-214", date: "2026-09-04", productId: "stationery-b", type: "out", qty: 15, reference: "Sale — SL-1024" },
  { id: "SM-213", date: "2026-08-29", productId: "grocery-a", type: "out", qty: 2, reference: "Sale — SL-1018" },
];

// ---- Derived helpers -------------------------------------------------

export function productById(id) {
  return products.find((p) => p.id === id);
}

export function customerById(id) {
  return customers.find((c) => c.id === id);
}

export function saleTotal(sale) {
  const product = productById(sale.productId);
  return product ? product.price * sale.qty : 0;
}

export function salePaidAmount(saleId) {
  return payments.filter((p) => p.saleId === saleId).reduce((sum, p) => sum + p.amount, 0);
}

export function salePaymentStatus(sale) {
  const total = saleTotal(sale);
  const paid = salePaidAmount(sale.id);
  if (paid <= 0) return "Pending";
  if (paid < total) return "Partial";
  return "Paid";
}

export function salesForCustomer(customerId) {
  return sales.filter((s) => s.customerId === customerId);
}

export function getCustomerStats(customerId) {
  const custSales = salesForCustomer(customerId);
  const totalPurchases = custSales.reduce((sum, s) => sum + saleTotal(s), 0);
  const totalPaid = custSales.reduce((sum, s) => sum + salePaidAmount(s.id), 0);
  const unitsTaken = custSales.reduce((sum, s) => sum + s.qty, 0);
  return {
    totalPurchases,
    totalPaid,
    outstanding: totalPurchases - totalPaid,
    unitsTaken,
  };
}

export function stockStatus(product) {
  const available = product.stockTotal - product.stockTaken;
  if (available <= 0) return { label: "Out of Stock", tone: "ink" };
  if (available <= product.reorderAt) return { label: "Low Stock", tone: "danger" };
  if (available <= product.reorderAt * 2) return { label: "Selling Fast", tone: "accent" };
  return { label: "In Stock", tone: "teal" };
}

export function dashboardTotals() {
  const totalStock = products.reduce((s, p) => s + p.stockTotal, 0);
  const totalTaken = products.reduce((s, p) => s + p.stockTaken, 0);
  const totalAvailable = totalStock - totalTaken;
  const lowStock = products.filter((p) => {
    const avail = p.stockTotal - p.stockTaken;
    return avail > 0 && avail <= p.reorderAt;
  }).length;
  const outOfStock = products.filter((p) => p.stockTotal - p.stockTaken <= 0).length;
  const totalSales = sales.reduce((s, sale) => s + saleTotal(sale), 0);
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

export function money(n) {
  return "NPR " + Math.round(n).toLocaleString("en-IN");
}
