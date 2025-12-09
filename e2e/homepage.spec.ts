import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage and display article sections", async ({ page }) => {
    await page.goto("/");
    
    // Check for main sections
    await expect(page.locator("text=Trending Stories").or(page.locator("text=Latest News"))).toBeVisible();
    await expect(page.locator("text=Deep Dives")).toBeVisible();
    await expect(page.locator("text=Latest Analysis")).toBeVisible();
  });

  test("should have navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });
});

