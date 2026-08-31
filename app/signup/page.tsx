import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

// SEO-01: public routes get a basic title/description (no OG/structured
// data investment — no public content strategy is funded this phase).
export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Moment account to turn your photos into a mood-matched Reel.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
