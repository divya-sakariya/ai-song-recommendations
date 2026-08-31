import { test as base, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { E2E_BASE_URL, E2E_NEXTAUTH_SECRET } from "./env";

// This sandbox has no reachable MongoDB (org network policy blocks
// fastdl.mongodb.org, and MongoDB isn't in the Ubuntu apt repos), so a real
// sign-up/sign-in can't run against the dev server here. The create flow
// itself (upload -> consent -> analyzing -> shortlist) needs no DB in demo
// mode (no GEMINI_API_KEY/SPOTIFY keys set for e2e), so we bypass the login
// screen with a real, correctly-signed NextAuth session JWT — the same
// mechanism `getServerSession`/middleware verify in production — rather
// than faking auth some other way. Registration/login themselves are
// covered separately by component tests (mocked next-auth/react) and API
// integration tests (mocked DB).
export const test = base.extend<{ authedPage: import("@playwright/test").Page }>({
  authedPage: async ({ browser }, use) => {
    const token = await encode({
      token: {
        sub: "e2e-user-id",
        userId: "e2e-user-id",
        email: "e2e@example.com",
        name: "E2E User",
      },
      secret: E2E_NEXTAUTH_SECRET,
    });

    const context = await browser.newContext();
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: token,
        url: E2E_BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
