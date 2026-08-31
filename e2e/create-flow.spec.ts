import path from "path";
import { test, expect } from "./fixtures";

const FIXTURES = path.join(__dirname, "fixtures");

// Critical path for Milestone 1's own stated goal: "a signed-in user can
// upload photos and receive a live, AI-generated song shortlist with why
// explanations." Runs in demo mode (no GEMINI/SPOTIFY/YOUTUBE keys set for
// e2e), which is a legitimate, fully-deterministic code path — see
// lib/ai/moodAnalysis.ts and lib/music/resolveSongs.ts.
test.describe("Create flow (ANALYSIS-01, SHORTLIST-01/02/03)", () => {
  test("upload -> consent -> analyzing -> shortlist -> select", async ({ authedPage: page }) => {
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "New session" })).toBeVisible();

    const fileInput = page.locator("#photo-input");
    await fileInput.setInputFiles([
      path.join(FIXTURES, "sample1.png"),
      path.join(FIXTURES, "sample2.jpg"),
    ]);
    await expect(page.getByAltText("Uploaded photo 1 of 2")).toBeVisible();
    await expect(page.getByAltText("Uploaded photo 2 of 2")).toBeVisible();

    const continueButton = page.getByRole("button", { name: "Run analysis" });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /I agree/ }).click();
    await expect(dialog).not.toBeVisible();

    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible({ timeout: 15_000 });

    const songItems = page.locator('ul[aria-label="Song shortlist"] li');
    await expect(songItems.first()).toBeVisible();
    const songCount = await songItems.count();
    expect(songCount).toBeGreaterThan(0);

    const continueToCaptions = page.getByRole("button", { name: "Continue to captions" });
    await expect(continueToCaptions).toBeDisabled();

    await songItems.first().getByRole("button", { name: "Select" }).click();
    await expect(songItems.first().getByRole("button", { name: "✓ Selected" })).toBeVisible();
    await expect(continueToCaptions).toBeEnabled();
  });

  test("declining consent keeps photos and does not start analysis (UPLOAD-04 edge case)", async ({
    authedPage: page,
  }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles(path.join(FIXTURES, "sample1.png"));
    await expect(page.getByAltText("Uploaded photo 1 of 1")).toBeVisible();

    await page.getByRole("button", { name: "Run analysis" }).click();
    await page.getByRole("button", { name: "Not now" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "New session" })).toBeVisible();
    await expect(page.getByAltText("Uploaded photo 1 of 1")).toBeVisible();
  });

  test("rejects an unsupported file type with an inline message (UPLOAD-01 edge case)", async ({
    authedPage: page,
  }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles({
      name: "notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not an image"),
    });

    // Next.js's own route-announcer div also carries role="alert", so scope
    // to the actual error text rather than the bare role.
    await expect(page.getByText(/Unsupported file type/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Run analysis" })).toBeDisabled();
  });

  test("manual search finds and selects a catalog song when the AI suggestions don't fit (SHORTLIST-04)", async ({
    authedPage: page,
  }) => {
    await page.goto("/create");
    await page.locator("#photo-input").setInputFiles(path.join(FIXTURES, "sample1.png"));
    await expect(page.getByAltText("Uploaded photo 1 of 1")).toBeVisible();
    await page.getByRole("button", { name: "Run analysis" }).click();
    await page.getByRole("button", { name: /I agree/ }).click();
    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible({ timeout: 15_000 });

    await page.getByText("Search a different track").click();
    await page.getByLabel("Search by song or artist").fill("Golden");
    await page.getByRole("button", { name: "Search" }).click();

    const results = page.getByRole("list", { name: "Search results" }).getByRole("listitem");
    await expect(results.first()).toBeVisible();
    await results.first().getByRole("button", { name: "Select" }).click();

    await expect(page.getByRole("button", { name: "Continue to captions" })).toBeEnabled();
  });
});
