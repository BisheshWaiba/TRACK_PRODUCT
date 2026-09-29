import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const DataContext = createContext(null);

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    bundleSize: p.bundle_size,
    items: p.items || [],
    stockTotal: p.stock_total,
    stockTaken: p.stock_taken,
    reorderAt: p.reorder_at,
  };
}
function mapCustomer(c) {
  return { id: c.id, name: c.name, contact: c.contact, phone: c.phone, address: c.address, city: c.city, joined: c.joined };
}
function mapSale(s) {
  return { id: s.id, date: s.date, customerId: s.customer_id, productId: s.product_id, qty: s.qty, status: s.status };
}
function mapPayment(p) {
  return { id: p.id, date: p.date, saleId: p.sale_id, amount: Number(p.amount), method: p.method };
}
function mapMovement(m) {
  return { id: m.id, date: m.date, productId: m.product_id, type: m.type, qty: m.qty, reference: m.reference };
}
function newId(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase();
}

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [pr, cr, sr, payr, mr] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("sales").select("*").order("date", { ascending: false }),
      supabase.from("payments").select("*").order("date", { ascending: false }),
      supabase.from("stock_movements").select("*").order("date", { ascending: false }),
    ]);
    const err = pr.error || cr.error || sr.error || payr.error || mr.error;
    setError(err ? err.message : null);
    setProducts((pr.data || []).map(mapProduct));
    setCustomers((cr.data || []).map(mapCustomer));
    setSales((sr.data || []).map(mapSale));
    setPayments((payr.data || []).map(mapPayment));
    setStockMovements((mr.data || []).map(mapMovement));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function productById(id) {
    return products.find((p) => p.id === id);
  }
  function customerById(id) {
    return customers.find((c) => c.id === id);
  }
  function saleTotal(sale) {
    const product = productById(sale.productId);
    return product ? product.price * sale.qty : 0;
  }
  function salePaidAmount(saleId) {
    return payments.filter((p) => p.saleId === saleId).reduce((sum, p) => sum + p.amount, 0);
  }
  function salePaymentStatus(sale) {
    const total = saleTotal(sale);
    const paid = salePaidAmount(sale.id);
    if (paid <= 0) return "Pending";
    if (paid < total) return "Partial";
    return "Paid";
  }
  function salesForCustomer(customerId) {
    return sales.filter((s) => s.customerId === customerId);
  }
  function getCustomerStats(customerId) {
    const custSales = salesForCustomer(customerId);
    const totalPurchases = custSales.reduce((sum, s) => sum + saleTotal(s), 0);
    const totalPaid = custSales.reduce((sum, s) => sum + salePaidAmount(s.id), 0);
    const unitsTaken = custSales.reduce((sum, s) => sum + s.qty, 0);
    return { totalPurchases, totalPaid, outstanding: totalPurchases - totalPaid, unitsTaken };
  }
  function stockStatus(product) {
    const available = product.stockTotal - product.stockTaken;
    if (available <= 0) return { label: "Out of Stock", tone: "ink" };
    if (available <= product.reorderAt) return { label: "Low Stock", tone: "danger" };
    if (available <= product.reorderAt * 2) return { label: "Selling Fast", tone: "accent" };
    return { label: "In Stock", tone: "teal" };
  }
  function dashboardTotals() {
    const totalStock = products.reduce((s, p) => s + p.stockTotal, 0);
    const totalTaken = products.reduce((s, p) => s + p.stockTaken, 0);
    const totalAvailable = totalStock - totalTaken;
    const lowStock = products.filter((p) => {
      const a = p.stockTotal - p.stockTaken;
      return a > 0 && a <= p.reorderAt;
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

  async function createProduct(input) {
    const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-" + Date.now().toString(36);
    const stockTotal = Number(input.stock) || 0;
    const row = {
      id,
      name: input.name,
      category: input.category || "General",
      price: Number(input.price) || 0,
      bundle_size: input.bundleSize || "1 item / bundle",
      items: [],
      stock_total: stockTotal,
      stock_taken: 0,
      reorder_at: Math.max(5, Math.round(stockTotal * 0.2)),
    };
    const { error: err } = await supabase.from("products").insert(row);
    if (err) throw err;
    setProducts((prev) => [...prev, mapProduct(row)]);
  }

  async function updateProduct(id, patch) {
    const row = {
      name: patch.name,
      category: patch.category || "General",
      price: Number(patch.price) || 0,
      bundle_size: patch.bundleSize,
      stock_total: Number(patch.stockTotal) || 0,
      reorder_at: Number(patch.reorderAt) || 0,
    };
    const { error: err } = await supabase.from("products").update(row).eq("id", id);
    if (err) throw err;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...mapProduct({ id, ...row, stock_taken: p.stockTaken, items: p.items }) } : p)));
  }

  async function deleteProduct(id) {
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) throw err;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function createCustomer(input) {
    const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    const row = {
      id,
      name: input.name,
      contact: input.contact,
      phone: input.phone,
      address: input.address,
      city: input.address.split(",").pop()?.trim() || "",
      joined: new Date().toISOString().slice(0, 10),
    };
    const { error: err } = await supabase.from("customers").insert(row);
    if (err) throw err;
    setCustomers((prev) => [...prev, mapCustomer(row)]);
  }

  async function createPayment({ saleId, amount, method, date }) {
    const id = newId("PM");
    const row = { id, date: date || new Date().toISOString().slice(0, 10), sale_id: saleId, amount: Number(amount) || 0, method: method || "Cash on Delivery" };
    const { error: err } = await supabase.from("payments").insert(row);
    if (err) throw err;
    setPayments((prev) => [mapPayment(row), ...prev]);
  }

  async function createSale({ customerId, productId, qty, paymentStatus }) {
    const id = newId("SL");
    const date = new Date().toISOString().slice(0, 10);
    const quantity = Number(qty) || 1;
    const row = { id, date, customer_id: customerId, product_id: productId, qty: quantity, status: "Order Placed" };
    const { error: err } = await supabase.from("sales").insert(row);
    if (err) throw err;
    setSales((prev) => [mapSale(row), ...prev]);

    const product = productById(productId);
    if (product) {
      const newTaken = product.stockTaken + quantity;
      await supabase.from("products").update({ stock_taken: newTaken }).eq("id", productId);
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stockTaken: newTaken } : p)));
    }
    if (paymentStatus === "Paid" || paymentStatus === "Partial") {
      const total = product ? product.price * quantity : 0;
      const amount = paymentStatus === "Paid" ? total : Math.round(total / 2);
      await createPayment({ saleId: id, amount, method: "Cash on Delivery", date });
    }
    return id;
  }

  async function createStockMovement({ productId, type, qty, reference }) {
    const id = newId("SM");
    const date = new Date().toISOString().slice(0, 10);
    const quantity = Number(qty) || 0;
    const row = { id, date, product_id: productId, type, qty: quantity, reference: reference || "Manual adjustment" };
    const { error: err } = await supabase.from("stock_movements").insert(row);
    if (err) throw err;
    setStockMovements((prev) => [mapMovement(row), ...prev]);

    const product = productById(productId);
    if (product) {
      const patch = type === "in" ? { stock_total: product.stockTotal + quantity } : { stock_taken: product.stockTaken + quantity };
      await supabase.from("products").update(patch).eq("id", productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? type === "in"
              ? { ...p, stockTotal: p.stockTotal + quantity }
              : { ...p, stockTaken: p.stockTaken + quantity }
            : p
        )
      );
    }
  }

  const value = {
    products,
    customers,
    sales,
    payments,
    stockMovements,
    loading,
    error,
    refresh,
    productById,
    customerById,
    saleTotal,
    salePaidAmount,
    salePaymentStatus,
    salesForCustomer,
    getCustomerStats,
    stockStatus,
    dashboardTotals,
    createProduct,
    updateProduct,
    deleteProduct,
    createCustomer,
    createSale,
    createPayment,
    createStockMovement,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
