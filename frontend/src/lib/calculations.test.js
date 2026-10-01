import { describe, expect, it } from "vitest";
import {
  customerById,
  dashboardTotals,
  getCustomerStats,
  productById,
  saleTotal,
  salePaidAmount,
  salePaymentStatus,
  invoiceTotal,
  invoicePaidAmount,
  invoicePaymentStatus,
  groupSalesByInvoice,
  salesForCustomer,
  stockStatus,
} from "./calculations";

const products = [
  { id: "p1", name: "Widget", price: 100, stockTotal: 50, stockTaken: 40, reorderAt: 10 },
  { id: "p2", name: "Gadget", price: 200, stockTotal: 20, stockTaken: 20, reorderAt: 5 },
  { id: "p3", name: "Gizmo", price: 50, stockTotal: 30, stockTaken: 5, reorderAt: 5 },
];

const customers = [
  { id: "c1", name: "Alice Store" },
  { id: "c2", name: "Bob Mart" },
];

const sales = [
  { id: "s1", customerId: "c1", productId: "p1", qty: 2 }, // total 200
  { id: "s2", customerId: "c1", productId: "p3", qty: 1 }, // total 50
  { id: "s3", customerId: "c2", productId: "p2", qty: 1 }, // total 200
];

const payments = [
  { id: "pm1", saleId: "s1", amount: 200 }, // s1 fully paid
  { id: "pm2", saleId: "s2", amount: 20 }, // s2 partially paid (20 of 50)
  // s3 has no payments at all -> pending
];

const invoice = { id: "inv1", total: 330 };
const invoiceSales = [
  { id: "is1", invoiceId: "inv1", customerId: "c1", productId: "p1", qty: 2, unitPrice: 100 },
  { id: "is2", invoiceId: "inv1", customerId: "c1", productId: "p3", qty: 1, unitPrice: 50 },
];
const invoicePayments = [{ id: "ip1", invoiceId: "inv1", amount: 100 }];

describe("productById / customerById", () => {
  it("finds an existing product by id", () => {
    expect(productById(products, "p2").name).toBe("Gadget");
  });
  it("returns undefined for an unknown id", () => {
    expect(productById(products, "nope")).toBeUndefined();
  });
  it("finds an existing customer by id", () => {
    expect(customerById(customers, "c1").name).toBe("Alice Store");
  });
});

describe("saleTotal", () => {
  it("multiplies product price by quantity", () => {
    expect(saleTotal(sales[0], products)).toBe(200);
  });
  it("returns 0 if the product no longer exists", () => {
    expect(saleTotal({ productId: "missing", qty: 3 }, products)).toBe(0);
  });
  it("uses the captured historical unit price", () => {
    expect(saleTotal({ productId: "p1", qty: 2, unitPrice: 75 }, products)).toBe(150);
  });
});

describe("invoice totals and payment status", () => {
  it("uses the invoice total including discount and VAT", () => {
    expect(invoiceTotal(invoice, invoiceSales, products)).toBe(330);
  });
  it("sums invoice payments without double-counting its lines", () => {
    expect(invoicePaidAmount(invoicePayments, "inv1", invoiceSales)).toBe(100);
    expect(invoicePaymentStatus(invoice, invoiceSales, products, invoicePayments)).toBe("Partial");
  });
  it("groups legacy sales as one-line invoices", () => {
    expect(groupSalesByInvoice([sales[0]], []).map((group) => group.lines[0].id)).toEqual(["s1"]);
  });
});

describe("salePaidAmount", () => {
  it("sums all payments for a sale", () => {
    expect(salePaidAmount(payments, "s1")).toBe(200);
  });
  it("returns 0 when a sale has no payments", () => {
    expect(salePaidAmount(payments, "s3")).toBe(0);
  });
});

describe("salePaymentStatus", () => {
  it("is Paid when payments cover the full total", () => {
    expect(salePaymentStatus(sales[0], products, payments)).toBe("Paid");
  });
  it("is Partial when some but not all of the total is paid", () => {
    expect(salePaymentStatus(sales[1], products, payments)).toBe("Partial");
  });
  it("is Pending when nothing has been paid", () => {
    expect(salePaymentStatus(sales[2], products, payments)).toBe("Pending");
  });
});

describe("salesForCustomer", () => {
  it("returns only sales belonging to that customer", () => {
    expect(salesForCustomer(sales, "c1").map((s) => s.id)).toEqual(["s1", "s2"]);
  });
  it("returns an empty array for a customer with no sales", () => {
    expect(salesForCustomer(sales, "nobody")).toEqual([]);
  });
});

describe("getCustomerStats", () => {
  it("aggregates purchases, paid amount, outstanding balance and units taken", () => {
    const stats = getCustomerStats("c1", sales, products, payments);
    expect(stats.totalPurchases).toBe(250); // 200 + 50
    expect(stats.totalPaid).toBe(220); // 200 + 20
    expect(stats.outstanding).toBe(30); // 250 - 220
    expect(stats.unitsTaken).toBe(3); // 2 + 1
  });
  it("reports zero outstanding for a customer with nothing purchased", () => {
    const stats = getCustomerStats("nobody", sales, products, payments);
    expect(stats).toEqual({ totalPurchases: 0, totalPaid: 0, outstanding: 0, unitsTaken: 0 });
  });
});

describe("stockStatus", () => {
  it("is Out of Stock when nothing is available", () => {
    expect(stockStatus(products[1]).label).toBe("Out of Stock");
  });
  it("is Low Stock when available is at or below the reorder point", () => {
    expect(stockStatus(products[0]).label).toBe("Low Stock"); // available 10, reorderAt 10
  });
  it("is Selling Fast when available is within 2x the reorder point", () => {
    expect(stockStatus({ stockTotal: 30, stockTaken: 15, reorderAt: 10 }).label).toBe("Selling Fast"); // available 15
  });
  it("is In Stock when comfortably above the reorder threshold", () => {
    expect(stockStatus(products[2]).label).toBe("In Stock"); // available 25, reorderAt 5
  });
});

describe("dashboardTotals", () => {
  it("computes stock, sales and payment aggregates across the whole dataset", () => {
    const totals = dashboardTotals(products, customers, sales, payments);
    expect(totals.totalProducts).toBe(3);
    expect(totals.totalStock).toBe(100); // 50+20+30
    expect(totals.totalTaken).toBe(65); // 40+20+5
    expect(totals.totalAvailable).toBe(35);
    expect(totals.outOfStock).toBe(1); // p2
    expect(totals.lowStock).toBe(1); // p1 (available 10 <= reorderAt 10), p2 excluded (0 available = out of stock, not low)
    expect(totals.totalSales).toBe(450); // 200+50+200
    expect(totals.amountReceived).toBe(220); // 200+20
    expect(totals.pendingPayments).toBe(230); // 450-220
    expect(totals.activeCustomers).toBe(2);
  });
});
