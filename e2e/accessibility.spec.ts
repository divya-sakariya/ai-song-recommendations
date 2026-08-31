import path from "path";
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect as baseExpect } from "@playwright/test";
import { test as authedTest, expect as authedExpect } from "./fixtures";

const FIXTURES = path.join(__dirname, "fixtures");

async function scan(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

function formatViolations(violations: { id: string; description: string; nodes: { html: string }[] }[]) {
  return violations
    .map((v) => `${v.id}: ${v.description}\n  ${v.nodes.map((n) => n.html).join("\n  ")}`)
    .join("\n\n");
}

// Automated axe-core scan (WCAG 2.1 A/AA) of every new screen, per the PRD's
// own accessibility metric (Section 3): "zero WCAG 2.1 AA violations on
// automated scan (axe-core)". Public pages use an unauthenticated context;
// the create-flow screens use the authed fixture (see fixtures.ts for why).
base.describe("Accessibility: public pages", () => {
  for (const path_ of ["/", "/signin", "/signup"]) {
    base(`${path_} has zero automated a11y violations`, async ({ page }) => {
      await page.goto(path_);
      const results = await scan(page);
      baseExpect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  }
});

authedTest.describe("Accessibility: create flow screens", () => {
  authedTest("upload screen has zero automated a11y violations", async ({ authedPage: page }) => {
    await page.goto("/create");
    const results = await scan(page);
    authedExpect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  authedTest("consent modal has zero automated a11y violations", async ({ authedPage: page }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles(path.join(FIXTURES, "sample1.png"));
    await page.getByRole("button", { name: "Run analysis" }).click();
    await authedExpect(page.getByRole("dialog")).toBeVisible();

    const results = await scan(page);
    authedExpect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  authedTest("shortlist screen has zero automated a11y violations", async ({ authedPage: page }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles(path.join(FIXTURES, "sample1.png"));
    await page.getByRole("button", { name: "Run analysis" }).click();
    await page.getByRole("button", { name: /I agree/ }).click();
    await authedExpect(page.getByRole("heading", { name: "Matches" })).toBeVisible({ timeout: 15_000 });

    const results = await scan(page);
    authedExpect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
