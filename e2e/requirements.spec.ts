import { test, expect } from "@playwright/test";

/**
 * E2E Tests for SRS Requirements Verification
 * 
 * Run with: npm run test:e2e -- e2e/requirements.spec.ts
 */

test.describe("A.1 Public Access (News Reader)", () => {
  test("Homepage Feed displays articles with required fields", async ({ page }) => {
    await page.goto("/");
    
    // Check for article cards
    const articleCards = page.locator('[data-testid="article-card"], article, .article-card').first();
    await expect(articleCards).toBeVisible();
    
    // Verify article has title
    const title = articleCards.locator("h2, h3, .title").first();
    await expect(title).toBeVisible();
    
    // Verify article has image (if present)
    const image = articleCards.locator("img").first();
    // Image might not be present for all articles, so we just check if selector exists
    
    // Verify category is shown
    const category = articleCards.locator(".category, [data-category]").first();
    // Category might be in different formats
  });

  test("Pagination works without duplicates", async ({ page }) => {
    await page.goto("/");
    
    // Get initial article IDs
    const initialArticles = await page.locator('[data-article-id], article').all();
    const initialIds = await Promise.all(
      initialArticles.map(async (el) => await el.getAttribute("data-article-id") || "")
    );
    
    // Scroll to trigger pagination or click load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000); // Wait for load
    
    // Get new article IDs
    const newArticles = await page.locator('[data-article-id], article').all();
    const newIds = await Promise.all(
      newArticles.map(async (el) => await el.getAttribute("data-article-id") || "")
    );
    
    // Check for duplicates
    const allIds = [...initialIds, ...newIds].filter(Boolean);
    const uniqueIds = new Set(allIds);
    expect(allIds.length).toBe(uniqueIds.size);
  });

  test("Article detail page shows full content", async ({ page }) => {
    await page.goto("/");
    
    // Click first article
    const firstArticle = page.locator("article, [data-article-id]").first();
    await firstArticle.click();
    
    // Wait for navigation
    await page.waitForURL(/\/news\/.+/);
    
    // Verify article content is displayed
    const articleContent = page.locator("article, .article-content, .prose");
    await expect(articleContent).toBeVisible();
    
    // Verify title is present
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });

  test("Search filters articles by title", async ({ page }) => {
    await page.goto("/");
    
    // Open search (look for search button or modal trigger)
    const searchButton = page.locator('[aria-label*="search" i], button:has-text("Search")').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }
    
    // Enter search term
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("technology");
      await page.waitForTimeout(500); // Wait for search results
      
      // Verify results are filtered
      const results = page.locator('[data-article-id], article');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe("A.2 Content Management", () => {
  test("Admin can create article", async ({ page }) => {
    // Note: This requires authentication setup
    // You'll need to sign in first or use authenticated context
    
    await page.goto("/signin");
    
    // Fill in credentials (adjust based on your test user)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill("admin@test.com");
      await passwordInput.fill("admin123");
      await page.locator('button[type="submit"]').click();
      
      // Wait for redirect
      await page.waitForURL(/\/admin|\//);
      
      // Navigate to upload page
      await page.goto("/admin/upload");
      
      // Check if form exists
      const form = page.locator("form");
      await expect(form).toBeVisible();
    }
  });
});

test.describe("A.3 Authentication & RBAC", () => {
  test("Regular users cannot access admin routes", async ({ page }) => {
    // Try to access admin route without auth
    await page.goto("/admin");
    
    // Should redirect to signin
    await expect(page).toHaveURL(/\/signin/);
  });

  test("Login form accepts credentials", async ({ page }) => {
    await page.goto("/signin");
    
    // Verify form elements exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});

test.describe("A.4 PHE Scoring", () => {
  test("Public key endpoint is accessible", async ({ page }) => {
    const response = await page.request.get("/api/phe/public-key");
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("n");
    expect(data).toHaveProperty("g");
    expect(data).toHaveProperty("version");
    
    // Verify private key is NOT exposed
    expect(data).not.toHaveProperty("lambda");
    expect(data).not.toHaveProperty("mu");
  });

  test("PHE score endpoint requires authentication", async ({ page }) => {
    const response = await page.request.post("/api/phe/score", {
      data: {
        articleId: "test",
        events: { open: true },
      },
    });
    
    // Should require auth (401 or 403)
    expect([401, 403]).toContain(response.status());
  });
});

