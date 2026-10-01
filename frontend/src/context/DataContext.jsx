import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import * as calc from "../lib/calculations";

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
    imageUrl: p.image_url || null,
  };
}
function mapCustomer(c) {
  return { id: c.id, name: c.name, contact: c.contact, phone: c.phone, address: c.address, city: c.city, joined: c.joined };
}
function mapSale(s) {
  return { id: s.id, date: s.date, customerId: s.customer_id, productId: s.product_id, qty: s.qty, status: s.status, invoiceId: s.invoice_id, unitPrice: s.unit_price == null ? null : Number(s.unit_price) };
}
function mapInvoice(i) {
  return {
    id: i.id, date: i.date, customerId: i.customer_id, subtotal: Number(i.subtotal),
    discountAmount: Number(i.discount_amount || 0), vatAmount: Number(i.vat_amount || 0),
    total: Number(i.total), paymentStatus: i.payment_status, createdAt: i.created_at, updatedAt: i.updated_at,
  };
}
function mapPayment(p) {
  return { id: p.id, date: p.date, saleId: p.sale_id, invoiceId: p.invoice_id, amount: Number(p.amount), method: p.method };
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
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [pr, cr, sr, ir, payr, mr] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("sales").select("*").order("date", { ascending: false }),
      supabase.from("sales_invoices").select("*").order("date", { ascending: false }),
      supabase.from("payments").select("*").order("date", { ascending: false }),
      supabase.from("stock_movements").select("*").order("date", { ascending: false }),
    ]);
    const err = pr.error || cr.error || sr.error || ir.error || payr.error || mr.error;
    setError(err ? err.message : null);
    setProducts((pr.data || []).map(mapProduct));
    setCustomers((cr.data || []).map(mapCustomer));
    setSales((sr.data || []).map(mapSale));
    setInvoices((ir.data || []).map(mapInvoice));
    setPayments((payr.data || []).map(mapPayment));
    setStockMovements((mr.data || []).map(mapMovement));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keeps every open session in sync: another tab/device inserting,
  // editing, or deleting a row shows up here live, not just as a
  // notification you'd otherwise have to reload the page to see.
  useEffect(() => {
    function applyChange(setState, mapFn, payload) {
      if (payload.eventType === "INSERT") {
        const mapped = mapFn(payload.new);
        setState((prev) => (prev.some((r) => r.id === mapped.id) ? prev : [...prev, mapped]));
      } else if (payload.eventType === "UPDATE") {
        const mapped = mapFn(payload.new);
        setState((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      } else if (payload.eventType === "DELETE") {
        setState((prev) => prev.filter((r) => r.id !== payload.old.id));
      }
    }

    const channel = supabase
      .channel("data-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (p) => applyChange(setProducts, mapProduct, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, (p) => applyChange(setCustomers, mapCustomer, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (p) => applyChange(setSales, mapSale, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_invoices" }, (p) => applyChange(setInvoices, mapInvoice, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, (p) => applyChange(setPayments, mapPayment, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, (p) => applyChange(setStockMovements, mapMovement, p))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function productById(id) {
    return calc.productById(products, id);
  }
  function customerById(id) {
    return calc.customerById(customers, id);
  }
  function saleTotal(sale) {
    return calc.saleTotal(sale, products);
  }
  function salePaidAmount(saleId) {
    return calc.salePaidAmount(payments, saleId);
  }
  function salePaymentStatus(sale) {
    return calc.salePaymentStatus(sale, products, payments);
  }
  function invoiceTotal(invoice) {
    return calc.invoiceTotal(invoice, sales, products);
  }
  function invoicePaidAmount(invoiceId) {
    return calc.invoicePaidAmount(payments, invoiceId, sales);
  }
  function invoicePaymentStatus(invoice) {
    return calc.invoicePaymentStatus(invoice, sales, products, payments);
  }
  function salesForCustomer(customerId) {
    return calc.salesForCustomer(sales, customerId);
  }
  function getCustomerStats(customerId) {
    return calc.getCustomerStats(customerId, sales, products, payments, invoices);
  }
  function stockStatus(product) {
    return calc.stockStatus(product);
  }
  function dashboardTotals() {
    return calc.dashboardTotals(products, customers, sales, payments, invoices);
  }

  async function uploadProductImage(productId, file) {
    const ext = file.name.split(".").pop();
    const path = `${productId}-${Date.now()}.${ext}`;
    const { error: err } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (err) throw err;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function createProduct(input) {
    const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-" + Date.now().toString(36);
    const stockTotal = Number(input.stock) || 0;
    const imageUrl = input.imageFile ? await uploadProductImage(id, input.imageFile) : null;
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
      image_url: imageUrl,
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
    if (patch.imageFile) {
      row.image_url = await uploadProductImage(id, patch.imageFile);
    }
    const { error: err } = await supabase.from("products").update(row).eq("id", id);
    if (err) throw err;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...mapProduct({ id, ...row, stock_taken: p.stockTaken, items: p.items, image_url: row.image_url ?? p.imageUrl }) } : p)));
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
      contact: input.contact || "",
      phone: input.phone || "",
      address: input.address || "",
      city: (input.address || "").split(",").pop()?.trim() || "",
      joined: new Date().toISOString().slice(0, 10),
    };
    const { error: err } = await supabase.from("customers").insert(row);
    if (err) throw err;
    setCustomers((prev) => [...prev, mapCustomer(row)]);
    return id;
  }

  async function updateCustomer(id, patch) {
    const row = {
      name: patch.name,
      contact: patch.contact,
      phone: patch.phone,
      address: patch.address,
      city: patch.address.split(",").pop()?.trim() || "",
    };
    const { error: err } = await supabase.from("customers").update(row).eq("id", id);
    if (err) throw err;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...row } : c)));
  }

  async function deleteCustomer(id) {
    const { error: err } = await supabase.from("customers").delete().eq("id", id);
    if (err) {
      if (err.code === "23503") throw new Error("Can't delete this customer — they have sales on record. Remove their sales first.");
      throw err;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  async function createPayment({ saleId = null, invoiceId = null, amount, method, date }) {
    const id = newId("PM");
    const row = { id, date: date || new Date().toISOString().slice(0, 10), sale_id: saleId, invoice_id: invoiceId, amount: Number(amount) || 0, method: method || "Cash on Delivery" };
    const { error: err } = await supabase.from("payments").insert(row);
    if (err) throw err;
    setPayments((prev) => [mapPayment(row), ...prev]);
  }

  async function updatePayment(id, patch) {
    const row = { amount: Number(patch.amount) || 0, method: patch.method, date: patch.date };
    const { error: err } = await supabase.from("payments").update(row).eq("id", id);
    if (err) throw err;
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...row } : p)));
  }

  async function createSale({ customerId, productId, qty, paymentStatus, partialAmount }) {
    const id = newId("SL");
    const date = new Date().toISOString().slice(0, 10);
    const quantity = Number(qty) || 1;
    const product = productById(productId);
    const row = { id, date, customer_id: customerId, product_id: productId, qty: quantity, unit_price: product?.price ?? null, status: "Order Placed" };
    const { error: err } = await supabase.from("sales").insert(row);
    if (err) throw err;
    setSales((prev) => [mapSale(row), ...prev]);

    if (product) {
      const newTaken = product.stockTaken + quantity;
      await supabase.from("products").update({ stock_taken: newTaken }).eq("id", productId);
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stockTaken: newTaken } : p)));
    }
    if (paymentStatus === "Paid" || paymentStatus === "Partial") {
      const total = product ? product.price * quantity : 0;
      const amount = paymentStatus === "Paid" ? total : Math.min(Math.max(Number(partialAmount) || 0, 1), total);
      await createPayment({ saleId: id, amount, method: "Cash on Delivery", date });
    }
    return id;
  }

  async function createInvoice({ customerId, lines, discountAmount = 0, vatAmount = 0, paymentStatus = "Pending", partialAmount = 0, date }) {
    const validLines = (lines || []).map((line) => {
      const product = productById(line.productId);
      const qty = Number(line.qty);
      const price = Number(line.unitPrice ?? product?.price);
      if (!product || !Number.isInteger(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) throw new Error("Each invoice line needs a product, a whole-number quantity, and a valid price.");
      return { product, productId: product.id, qty, unitPrice: price };
    });
    if (!customerId || validLines.length === 0) throw new Error("Choose a customer and add at least one product.");

    const quantities = new Map();
    for (const line of validLines) quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.qty);
    for (const [productId, qty] of quantities) {
      const product = productById(productId);
      if (qty > product.stockTotal - product.stockTaken) throw new Error(`${product.name} does not have enough stock.`);
    }

    const subtotal = validLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const discount = Math.max(0, Number(discountAmount) || 0);
    const vat = Math.max(0, Number(vatAmount) || 0);
    const total = Math.max(0, subtotal - discount + vat);
    const paid = paymentStatus === "Paid" ? total : paymentStatus === "Partial" ? Number(partialAmount) || 0 : 0;
    if (!["Paid", "Partial", "Pending"].includes(paymentStatus) || paid < 0 || paid > total || (paymentStatus === "Partial" && paid <= 0)) {
      throw new Error("Payment amount must be greater than zero and no more than the invoice total.");
    }

    const invoiceId = newId("INV");
    const invoiceRow = { id: invoiceId, date: date || new Date().toISOString().slice(0, 10), customer_id: customerId, subtotal, discount_amount: discount, vat_amount: vat, total, payment_status: paymentStatus };
    const saleRows = validLines.map((line, index) => ({ id: `${invoiceId}-L${index + 1}`, date: invoiceRow.date, customer_id: customerId, product_id: line.productId, qty: line.qty, unit_price: line.unitPrice, invoice_id: invoiceId, status: "Order Placed" }));
    const changedStock = [];
    try {
      let result = await supabase.from("sales_invoices").insert(invoiceRow);
      if (result.error) throw result.error;
      result = await supabase.from("sales").insert(saleRows);
      if (result.error) throw result.error;
      for (const [productId, qty] of quantities) {
        const product = productById(productId);
        const newTaken = product.stockTaken + qty;
        result = await supabase.from("products").update({ stock_taken: newTaken }).eq("id", productId);
        if (result.error) throw result.error;
        changedStock.push({ productId, previous: product.stockTaken });
      }
      if (paid > 0) await createPayment({ invoiceId, amount: paid, method: "Cash on Delivery", date: invoiceRow.date });
    } catch (err) {
      await supabase.from("payments").delete().eq("invoice_id", invoiceId);
      await supabase.from("sales").delete().eq("invoice_id", invoiceId);
      for (const stock of changedStock) await supabase.from("products").update({ stock_taken: stock.previous }).eq("id", stock.productId);
      await supabase.from("sales_invoices").delete().eq("id", invoiceId);
      await refresh();
      throw err;
    }
    await refresh();
    return invoiceId;
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
    invoices,
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
    invoiceTotal,
    invoicePaidAmount,
    invoicePaymentStatus,
    salesForCustomer,
    getCustomerStats,
    stockStatus,
    dashboardTotals,
    createProduct,
    updateProduct,
    deleteProduct,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createSale,
    createInvoice,
    createPayment,
    updatePayment,
    createStockMovement,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
