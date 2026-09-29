import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import PublicLayout from "./components/layout/PublicLayout";
import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";

import Home from "./pages/public/Home";
import Bundles from "./pages/public/Bundles";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import TrackOrder from "./pages/public/TrackOrder";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import Dashboard from "./pages/customer/Dashboard";
import BrowseBundles from "./pages/customer/BrowseBundles";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import OrderDetails from "./pages/customer/OrderDetails";
import TrackShipment from "./pages/customer/TrackShipment";
import Profile from "./pages/customer/Profile";

import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Inventory from "./pages/admin/Inventory";
import Customers from "./pages/admin/Customers";
import CustomerDetail from "./pages/admin/CustomerDetail";
import Sales from "./pages/admin/Sales";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import Account from "./pages/admin/Account";
import AdminLogin from "./pages/admin/AdminLogin";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-center">
      <div className="font-display text-4xl font-bold">404</div>
      <p className="text-ink-soft">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public marketing site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track" element={<TrackOrder />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer app */}
          <Route path="/app" element={<CustomerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bundles" element={<BrowseBundles />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="track" element={<TrackShipment />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Wholesaler / admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="sales" element={<Sales />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account" element={<Account />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
