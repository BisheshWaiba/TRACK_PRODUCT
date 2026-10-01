import { test, expect } from "@playwright/test";
import { login, ADMIN_EMAIL } from "./fixtures.js";

test.describe("authentication", () => {
  test("unauthenticated visitors are redirected to /login", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("wrong password is rejected with a clear error, no navigation", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type=email]").fill(ADMIN_EMAIL);
    await page.locator("input[type=password]").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("correct credentials log in and reach the dashboard", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" }).or(page.getByText("Dashboard").first())).toBeVisible();
  });

  test("logout ends the session and blocks protected routes again", async ({ page }) => {
    await login(page);
    await page.goto("/account");
    await page.getByRole("button", { name: "Log Out of BulkTrack" }).click();
    await page.getByRole("button", { name: "Log Out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/products");
    await expect(page).toHaveURL(/\/login$/);
  });
});
