# BulkTrack

**Wholesale Bundle Ordering & Inventory Management System**

BulkTrack connects wholesale bundle ordering with real-time stock tracking — retailers can browse and order bundles while seeing exactly how much stock is left, and the wholesaler runs the entire business (products, inventory, sales, payments, customers) from one admin dashboard.

This repo currently contains the **frontend** — a complete, working React application running on mock data. There is no backend/database yet.

## Live areas

The app has two independent sides, both in this one frontend:

### Customer-facing site (`/`, `/app/*`)
- Public marketing site: Home, Bundles catalog, About, Contact, public order tracking
- Retailer login/registration
- Logged-in customer app: Dashboard, Browse Bundles, Cart, Checkout, My Orders, Order Details, Track Shipment, Profile

### Wholesaler admin (`/admin/*`)
- Dashboard with live KPIs: total stock, units sold/available, low-stock & out-of-stock alerts, revenue, payments received/pending
- Products — add/edit/delete, stock levels, bundle size, pricing
- Inventory — stock-in/stock-out movements with full history
- Customers — purchase history, units taken, outstanding balance per customer
- Sales — record new sales with live total calculation and automatic inventory deduction
- Payments — record full/partial/pending payments, per-customer payment history
- Reports — tabbed sales, inventory, payment, and stock-movement reports
- Account & authentication (login, logout, profile)

All numbers on every page are computed from one shared mock data source (`frontend/src/data/mockData.js`), so stock levels, customer balances, and dashboard totals stay consistent with each other.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite |
| Routing | React Router 7 |
| Styling | Tailwind CSS |
| Data | In-memory mock data (no backend yet) |

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint      # run oxlint
```

## Project structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── icons/        # Single Icon component, all SVGs in one lookup
│   │   ├── layout/        # PublicLayout, CustomerLayout, AdminLayout + their nav
│   │   └── ui/             # Badge, Modal, Field, ProgressBar, StatCard, BundleCard
│   ├── context/             # CartContext (localStorage-backed cart state)
│   ├── data/
│   │   ├── mockData.js      # Products, customers, sales, payments, stock movements
│   │   └── tracking.js      # Shipment status timeline logic
│   ├── pages/
│   │   ├── public/           # Home, Bundles, About, Contact, TrackOrder, Login, Register
│   │   ├── customer/          # Dashboard, BrowseBundles, Cart, Checkout, MyOrders, ...
│   │   └── admin/               # Dashboard, Products, Inventory, Customers, Sales, Payments, Reports, ...
│   └── App.jsx                   # All routes
└── tailwind.config.js               # Design tokens (colors, fonts) shared across the app
```

## Known limitations

- **No backend.** Everything runs on mock data in memory. Changes made in one browser tab (a new sale, a payment) don't persist across a page refresh or sync to another tab/device — only the shopping cart persists, via `localStorage`.
- **No real authentication.** Login/logout forms are UI-only; any credentials "work."
- **Desktop-first.** Built and verified at desktop widths; tablet/mobile breakpoints haven't been tuned yet.

## Suggested next steps

1. Build a real backend (Django/Node/etc.) with the implied data model: `Product`, `Customer`, `Sale`/`SaleItem`, `Payment`, `StockMovement`
2. Replace `mockData.js` calls with API calls
3. Add real authentication and role-based access (retailer vs. wholesaler admin)
4. Add responsive breakpoints for tablet/mobile
