import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

// SEO-01: public routes get a basic title/description (no OG/structured
// data investment — no public content strategy is funded this phase).
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Moment to turn your photos into a mood-matched Reel.",
};

export default function SignInPage() {
  return <SignInForm />;
}
