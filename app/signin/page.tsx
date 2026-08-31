import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

// SEO-01: public routes get a basic title/description (no OG/structured
// data investment — no public content strategy is funded this phase).
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Moment to turn your photos into a mood-matched Reel.",
};

// SignInForm reads the callbackUrl via useSearchParams(). Statically
// prerendering a page that does that inside Suspense makes Next.js bail
// the whole boundary to client-only rendering (BAILOUT_TO_CLIENT_SIDE_RENDERING)
// — verified via `curl`, the entire form (heading, inputs, labels) was
// missing from the server-rendered HTML, present only after hydration.
// Forcing dynamic rendering resolves the real search params per-request
// server-side instead, so the full form is in the initial HTML.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return <SignInForm />;
}
