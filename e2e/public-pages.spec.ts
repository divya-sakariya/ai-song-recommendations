import { test, expect } from "@playwright/test";

test.describe("Public pages and route protection (SEO-01, AUTH-01)", () => {
  test("home page loads with its own title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Moment/);
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("sign-in and sign-up pages have distinct titles", async ({ page }) => {
    await page.goto("/signin");
    await expect(page).toHaveTitle("Sign in — Moment");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await page.goto("/signup");
    await expect(page).toHaveTitle("Sign up — Moment");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("visiting /create while signed out redirects to /signin with a callbackUrl", async ({ page }) => {
    await page.goto("/create");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fcreate/);
  });

  test("robots.txt disallows the authenticated app paths", async ({ page }) => {
    const res = await page.goto("/robots.txt");
    const body = await res!.text();
    expect(body).toContain("Disallow: /create");
    expect(body).toContain("Disallow: /account");
  });

  test("sign-up rejects a password under 8 characters with an inline error, without navigating away", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("new@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Sign up" }).click();

    // Next.js's own route-announcer div also carries role="alert", and the
    // field hint text separately mentions "8 characters" — scope to the
    // actual error paragraph specifically.
    await expect(page.locator('p[role="alert"]')).toContainText(/8 characters/);
    await expect(page).toHaveURL(/\/signup/);
  });
});
