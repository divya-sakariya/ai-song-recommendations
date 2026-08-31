import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_NEXTAUTH_SECRET } from "./e2e/env";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The installed @playwright/test version expects a newer browser
        // revision than what's pre-installed in this sandbox; point at the
        // pre-installed Chromium directly rather than downloading.
        launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${new URL(E2E_BASE_URL).port}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      MONGODB_URI: "mongodb://localhost:27017/e2e-placeholder",
      NEXTAUTH_URL: E2E_BASE_URL,
      NEXTAUTH_SECRET: E2E_NEXTAUTH_SECRET,
    },
  },
});
