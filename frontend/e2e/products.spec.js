import { test, expect } from "@playwright/test";
import { login, uniqueName, makeCleanupClient, cleanupTestData } from "./fixtures.js";

test.describe("products", () => {
  let cleanupClient;

  test.beforeAll(async () => {
    cleanupClient = await makeCleanupClient();
  });

  test.afterEach(async () => {
    await cleanupTestData(cleanupClient);
  });

  test("add, edit, and delete a product end to end", async ({ page }) => {
    await login(page);
    await page.goto("/products");

    const name = uniqueName("Product");
    await page.getByRole("button", { name: "Add Product" }).click();
    await page.locator("label:has-text('Product Name') input").fill(name);
    await page.locator("label:has-text('Category') input").fill("E2E");
    await page.locator("label:has-text('Unit Price') input").fill("150");
    await page.locator("label:has-text('Bundle Size') input").fill("1 item");
    await page.locator("label:has-text('Opening Quantity') input").fill("40");
    await page.getByRole("button", { name: "Save Product" }).click();

    // Scoped to the desktop table row specifically — the same product name
    // also renders (CSS-hidden) in the mobile card markup, so a bare
    // getByText(name) is ambiguous even at a desktop viewport.
    const row = page.locator("div.grid.border-t", { hasText: name });
    await expect(row).toBeVisible();

    // Edit: bump the price and confirm it's reflected
    await row.locator("button").first().click();
    await page.locator("label:has-text('Unit Price') input").fill("275");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.locator("div.grid.border-t", { hasText: name })).toContainText("NPR 275");

    // Delete: row disappears
    const updatedRow = page.locator("div.grid.border-t", { hasText: name });
    await updatedRow.locator("button").nth(1).click();
    await expect(page.locator("div.grid.border-t", { hasText: name })).toHaveCount(0);
  });

  test("a product's low-stock badge reflects available vs. reorder point", async ({ page }) => {
    await login(page);
    await page.goto("/products");

    const name = uniqueName("LowStockProduct");
    await page.getByRole("button", { name: "Add Product" }).click();
    await page.locator("label:has-text('Product Name') input").fill(name);
    await page.locator("label:has-text('Category') input").fill("E2E");
    await page.locator("label:has-text('Unit Price') input").fill("10");
    await page.locator("label:has-text('Bundle Size') input").fill("1 item");
    // Small opening quantity -> reorder_at = max(5, round(qty*0.2)) makes it start at/below threshold
    await page.locator("label:has-text('Opening Quantity') input").fill("5");
    await page.getByRole("button", { name: "Save Product" }).click();

    const row = page.locator("div.grid.border-t", { hasText: name });
    await expect(row.getByText(/Low Stock|Out of Stock/)).toBeVisible();
  });
});
