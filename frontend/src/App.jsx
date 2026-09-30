import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { NotificationProvider } from "./context/NotificationContext";
import { FinanceProvider } from "./context/FinanceContext";
import RequireAuth from "./components/RequireAuth";
import AdminLayout from "./components/layout/AdminLayout";

import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Inventory from "./pages/admin/Inventory";
import Customers from "./pages/admin/Customers";
import CustomerDetail from "./pages/admin/CustomerDetail";
import Sales from "./pages/admin/Sales";
import Payments from "./pages/admin/Payments";
import Finance from "./pages/admin/Finance";
import Purchases from "./pages/admin/Purchases";
import Expenses from "./pages/admin/Expenses";
import ReceivedPayments from "./pages/admin/ReceivedPayments";
import BankAccounts from "./pages/admin/BankAccounts";
import DayBook from "./pages/admin/DayBook";
import Reports from "./pages/admin/Reports";
import Account from "./pages/admin/Account";
import AdminLogin from "./pages/admin/AdminLogin";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-center">
      <div className="font-display text-4xl font-bold">404</div>
      <p className="text-ink-soft">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <DataProvider>
                  <FinanceProvider>
                    <NotificationProvider>
                      <AdminLayout />
                    </NotificationProvider>
                  </FinanceProvider>
                </DataProvider>
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="sales" element={<Sales />} />
            <Route path="payments" element={<Payments />} />
            <Route path="finance" element={<Finance />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="received-payments" element={<ReceivedPayments />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
            <Route path="daybook" element={<DayBook />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account" element={<Account />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
