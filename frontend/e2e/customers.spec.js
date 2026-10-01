import { test, expect } from "@playwright/test";
import { login, uniqueName, makeCleanupClient, cleanupTestData } from "./fixtures.js";

test.describe("customers", () => {
  let cleanupClient;

  test.beforeAll(async () => {
    cleanupClient = await makeCleanupClient();
  });

  test.afterEach(async () => {
    await cleanupTestData(cleanupClient);
  });

  // A dedicated, always-in-stock product so these tests don't depend on
  // whichever real product happens to be first in the dropdown (which
  // could be out of stock and therefore disabled).
  async function seedProduct() {
    const id = "e2e-product-" + Date.now();
    const { error } = await cleanupClient.from("products").insert({
      id,
      name: uniqueName("CustomerFlowProduct"),
      category: "E2E",
      price: 100,
      bundle_size: "1 item",
      stock_total: 100,
      stock_taken: 0,
      reorder_at: 10,
    });
    if (error) throw error;
    return id;
  }

  test("add a customer with an initial purchase marked Paid", async ({ page }) => {
    const productId = await seedProduct();
    await login(page);
    await page.goto("/customers");

    const name = uniqueName("Customer");
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.locator("label:has-text('Business Name') input").fill(name);
    await page.locator("label:has-text('Contact Person') input").fill("E2E Contact");
    await page.locator("label:has-text('Phone') input").fill("980-0000000");
    await page.locator("label:has-text('Address') input").fill("Test Address, Kathmandu");
    await page.locator("select").selectOption({ value: productId });
    await page.locator("form").getByRole("button", { name: "Paid", exact: true }).click();
    await page.getByRole("button", { name: "Save Customer" }).click();

    // The list updates reactively (no reload needed) once the async
    // create finishes — DON'T navigate here, a hard nav would abort the
    // in-flight request. expect()'s auto-retry covers the wait instead.
    const row = page.locator("a", { hasText: name }).first();
    await expect(row.getByText("Paid Up").first()).toBeVisible();
  });

  test("edit a customer's details without touching their purchases", async ({ page }) => {
    await login(page);
    await page.goto("/customers");

    const name = uniqueName("EditableCustomer");
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.locator("label:has-text('Business Name') input").fill(name);
    await page.locator("label:has-text('Contact Person') input").fill("Original Contact");
    await page.locator("label:has-text('Phone') input").fill("980-1111111");
    await page.locator("label:has-text('Address') input").fill("Original Address");
    await page.getByRole("button", { name: "Save Customer" }).click();

    const row = page.locator("a", { hasText: name }).first();
    await expect(row).toBeVisible();
    await row.getByTitle("Edit customer").click();
    await page.locator("label:has-text('Phone') input").fill("980-2222222");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.locator("a", { hasText: name }).first()).toContainText("980-2222222");
  });

  test("deleting a customer with sales is blocked with a clear message", async ({ page }) => {
    const productId = await seedProduct();
    await login(page);
    await page.goto("/customers");

    const name = uniqueName("ProtectedCustomer");
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.locator("label:has-text('Business Name') input").fill(name);
    await page.locator("label:has-text('Contact Person') input").fill("E2E Contact");
    await page.locator("label:has-text('Phone') input").fill("980-3333333");
    await page.locator("label:has-text('Address') input").fill("Test Address");
    await page.locator("select").selectOption({ value: productId });
    await page.getByRole("button", { name: "Save Customer" }).click();

    const row = page.locator("a", { hasText: name }).first();
    await expect(row).toBeVisible();
    await row.getByTitle("Delete customer").click();
    await page.getByRole("button", { name: "Delete Customer", exact: true }).click();

    await expect(page.getByText(/sales on record/i)).toBeVisible();
    // Customer must still be there since the delete was correctly blocked
    await expect(page.locator("a", { hasText: name }).first()).toBeVisible();
  });
});
