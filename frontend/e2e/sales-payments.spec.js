import { test, expect } from "@playwright/test";
import { login, uniqueName, makeCleanupClient, cleanupTestData } from "./fixtures.js";

// Sales/Payments need an existing customer and product to choose from.
// Rather than depending on whatever real data happens to exist, each
// test seeds its own tagged fixtures directly via Supabase (fast, and
// keeps the thing actually under test — the Sales/Payments UI — separate
// from the setup step).
test.describe("sales and payments", () => {
  let cleanupClient;
  let productId;
  let customerId;
  let productName;
  let customerName;

  test.beforeEach(async () => {
    cleanupClient = await makeCleanupClient();
    productName = uniqueName("SalesTestProduct");
    customerName = uniqueName("SalesTestCustomer");
    productId = "e2e-product-" + Date.now();
    customerId = "e2e-customer-" + Date.now();

    const { error: pErr } = await cleanupClient.from("products").insert({
      id: productId,
      name: productName,
      category: "E2E",
      price: 100,
      bundle_size: "1 item",
      stock_total: 100,
      stock_taken: 0,
      reorder_at: 10,
    });
    if (pErr) throw pErr;

    const { error: cErr } = await cleanupClient.from("customers").insert({
      id: customerId,
      name: customerName,
      contact: "E2E Contact",
      phone: "980-9999999",
      address: "Test Address",
      city: "Kathmandu",
    });
    if (cErr) throw cErr;
  });

  test.afterEach(async () => {
    await cleanupTestData(cleanupClient);
  });

  // The submit button's own text flips to "Saving…" (disabled={saving})
  // almost immediately, so waiting for its accessible name to disappear
  // is a false-positive trap — it fires long before the async save
  // actually finishes. Wait for the modal's overlay to unmount instead,
  // which only happens after setModalOpen(false) runs post-await.
  const modalOverlay = (page) => page.locator("div.fixed.inset-0");

  test("recording a sale with a custom Partial amount produces the right balance", async ({ page }) => {
    await login(page);
    await page.goto("/sales");
    await page.getByRole("button", { name: "Record New Sale" }).click();

    await page.locator("form select").nth(0).selectOption({ value: customerId });
    await page.locator("form select").nth(1).selectOption({ value: productId });
    await page.locator("form").getByRole("button", { name: "Partial", exact: true }).click();
    await page.waitForTimeout(200); // let the Amount Paid Now field render before filling it
    await page.locator("label:has-text('Amount Paid Now') input").fill("40"); // custom, not the auto-half (50)
    await page.getByRole("button", { name: "Confirm Sale" }).click();
    await expect(modalOverlay(page)).toHaveCount(0, { timeout: 10000 });

    await page.goto("/payments");
    const row = page.locator("div.grid.border-t", { hasText: customerName });
    await expect(row.getByText("Partial")).toBeVisible();
    await expect(row).toContainText("NPR 40"); // paid column shows the custom amount, not 50
  });

  test("editing a payment up to the full total flips the sale to Paid", async ({ page }) => {
    await login(page);
    await page.goto("/sales");
    await page.getByRole("button", { name: "Record New Sale" }).click();
    await page.locator("form select").nth(0).selectOption({ value: customerId });
    await page.locator("form select").nth(1).selectOption({ value: productId });
    await page.locator("form").getByRole("button", { name: "Partial", exact: true }).click();
    await page.waitForTimeout(200); // let the Amount Paid Now field render before filling it
    await page.locator("label:has-text('Amount Paid Now') input").fill("30");
    await page.getByRole("button", { name: "Confirm Sale" }).click();
    await expect(modalOverlay(page)).toHaveCount(0, { timeout: 10000 });

    await page.goto("/payments");
    const row = page.locator("div.grid.border-t", { hasText: customerName });
    await row.getByTitle("Edit payment").click();
    await page.locator("label:has-text('Amount Paid') input").fill("100");
    await expect(page.getByText("This will mark the sale as fully Paid.")).toBeVisible();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(modalOverlay(page)).toHaveCount(0, { timeout: 10000 });

    await expect(page.locator("div.grid.border-t", { hasText: customerName }).getByText("Paid", { exact: true })).toBeVisible();
  });
});
