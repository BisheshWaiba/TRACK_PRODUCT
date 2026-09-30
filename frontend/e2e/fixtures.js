import { createClient } from "@supabase/supabase-js";

// No hardcoded fallback here on purpose — this repo is public, so a
// default real password baked into source would leak it to anyone
// browsing GitHub. Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in
// frontend/.env.local (already gitignored) before running this suite.
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in frontend/.env.local to run the e2e suite (see e2e/README.md)."
  );
}

// A small tag every test-created record carries in its name, so cleanup
// (and a human glancing at real data) can immediately tell it apart from
// genuine business data. Combined with a per-run timestamp so parallel
// or repeated runs never collide.
export function uniqueName(label) {
  return `[e2e] ${label} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function login(page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.locator("input[type=email]").fill(ADMIN_EMAIL);
  await page.locator("input[type=password]").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 10_000 });
}

// A Supabase client authenticated as the same admin user, used only to
// clean up records a test created — directly, not through the UI — so
// cleanup still runs even if the UI flow under test is what's broken.
export async function makeCleanupClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must be set (see frontend/.env.local) to run e2e tests.");
  }
  const client = createClient(url, anonKey);
  const { error } = await client.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (error) throw error;
  return client;
}

// Sweeps up every row whose name carries the "[e2e]" tag, rather than
// tracking exact generated ids (the app generates those internally, so
// a test can't predict them ahead of time). Deletes sales referencing a
// tagged product/customer first (FK-safe); payments and stock_movements
// then disappear on their own via ON DELETE CASCADE. Safe to call even
// if a test failed partway through and never created everything.
export async function cleanupTestData(client) {
  const { data: testProducts } = await client.from("products").select("id").ilike("name", "[e2e]%");
  const { data: testCustomers } = await client.from("customers").select("id").ilike("name", "[e2e]%");
  const productIds = (testProducts || []).map((p) => p.id);
  const customerIds = (testCustomers || []).map((c) => c.id);

  if (productIds.length) {
    await client.from("sales").delete().in("product_id", productIds);
    await client.from("products").delete().in("id", productIds);
  }
  if (customerIds.length) {
    await client.from("sales").delete().in("customer_id", customerIds);
    await client.from("customers").delete().in("id", customerIds);
  }
}
