import { test, expect } from "@playwright/test";
import { login } from "./fixtures.js";

// A manual mobile viewport instead of devices["iPhone 12"] — that preset
// forces the WebKit engine, but this project only runs Chromium.
test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

test.describe("mobile layout", () => {
  async function hasHorizontalOverflow(page) {
    return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  }

  test("no horizontal overflow on any core page", async ({ page }) => {
    await login(page);
    for (const path of ["/", "/products", "/inventory", "/customers", "/sales", "/payments", "/reports", "/account"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(await hasHorizontalOverflow(page), `${path} should not scroll horizontally`).toBe(false);
    }
  });

  test("hamburger opens the nav drawer, and tapping a link navigates and closes it", async ({ page }) => {
    await login(page);
    await page.goto("/");

    const sidebar = page.locator("nav").locator("xpath=ancestor::div[contains(@class,'bg-sidebar')]");
    expect((await sidebar.boundingBox()).x).toBeLessThan(-100);

    await page.getByLabel("Open menu").click();
    await expect.poll(async () => (await sidebar.boundingBox()).x, { timeout: 2000 }).toBeGreaterThanOrEqual(-1);

    await page.locator("nav a", { hasText: "Products" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect.poll(async () => (await sidebar.boundingBox()).x, { timeout: 2000 }).toBeLessThan(-100);
  });
});
