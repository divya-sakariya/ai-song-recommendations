import path from "path";
import { test, expect } from "./fixtures";

const FIXTURES = path.join(__dirname, "fixtures");

// Manual keyboard-only pass on the critical flow (ACCESS-01/02 baseline,
// pulled forward per the brief's non-negotiable "keyboard-reachable,
// focus-visible" default rather than deferred to Milestone 2's formal
// verification story). No mouse clicks anywhere in this file — every
// interaction is Tab/Shift+Tab/Enter/Space, and each step asserts focus
// actually lands on the new screen's heading rather than resetting to
// <body> (the bug fixed in components/create/{Upload,Analyzing,Shortlist}Screen.tsx).
test.describe("Keyboard-only navigation (critical flow)", () => {
  test("completes upload -> consent -> analyzing -> shortlist -> select using only the keyboard", async ({
    authedPage: page,
  }) => {
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "New session" })).toBeFocused();

    // Reach the (visually-hidden but keyboard/SR-reachable) file input and
    // pick files — see PhotoDropzone.tsx for why it's a real, focusable
    // input rather than purely a styled button.
    const fileInput = page.getByLabel("Choose photos");
    await fileInput.focus();
    await expect(fileInput).toBeFocused();
    await fileInput.setInputFiles([path.join(FIXTURES, "sample1.png")]);
    await expect(page.getByAltText("Uploaded photo 1 of 1")).toBeVisible();

    // Tab to "Run analysis" and activate with the keyboard.
    let guard = 0;
    while (!(await page.getByRole("button", { name: "Run analysis" }).evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("Tab");
      if (++guard > 20) throw new Error("Could not reach 'Run analysis' by tabbing");
    }
    await page.keyboard.press("Enter");

    // Consent modal: focus must be trapped inside it and moved there on open.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Not now" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /I agree/ })).toBeFocused();
    await page.keyboard.press("Tab");
    // Focus wraps back to the first control instead of escaping the dialog.
    await expect(page.getByRole("button", { name: "Not now" })).toBeFocused();

    await page.getByRole("button", { name: /I agree/ }).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).not.toBeVisible();

    // Analyzing -> Shortlist: focus should land on the new heading, not <body>.
    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Matches" })).toBeFocused();

    // Tab to the first song's Select button and activate with the keyboard.
    guard = 0;
    while (!(await page.getByRole("button", { name: "Select" }).first().evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("Tab");
      if (++guard > 30) throw new Error("Could not reach the first song's Select button by tabbing");
    }
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "✓ Selected" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to captions" })).toBeEnabled();
  });

  test("Escape closes the consent modal via the keyboard and returns focus to the page", async ({
    authedPage: page,
  }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles(path.join(FIXTURES, "sample1.png"));
    await page.getByRole("button", { name: "Run analysis" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
