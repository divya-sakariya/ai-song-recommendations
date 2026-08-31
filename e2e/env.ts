// Shared between playwright.config.ts (webServer env) and the auth fixture
// (which crafts a matching session JWT) so they never drift apart.
export const E2E_BASE_URL = "http://localhost:3100";
export const E2E_NEXTAUTH_SECRET = "e2e-test-secret-do-not-use-in-prod-0000000000";
