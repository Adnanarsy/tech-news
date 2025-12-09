import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to signin when accessing protected routes", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("should show signin page", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

