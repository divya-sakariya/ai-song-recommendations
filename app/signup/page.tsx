"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong creating your account. Please try again.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Account created, but sign-in failed. Try signing in from the sign-in page.");
      return;
    }

    router.push("/create");
  }

  async function handleGoogleSignIn() {
    setError(null);
    const result = await signIn("google", { redirect: false, callbackUrl: "/create" });
    if (result?.error) {
      setError("Google sign-in didn't go through. Please try again.");
    } else if (result?.url) {
      router.push(result.url);
    }
  }

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-h1 mb-1">Create your account</h1>
        <p className="text-text-soft text-body mb-8">Start turning photos into Reels.</p>

        {error && (
          <p role="alert" className="text-small text-red-400 mb-4 flex items-center gap-1.5">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="name"
            label="Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full mt-6" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-text-soft text-small">
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
          or
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogleSignIn} type="button">
          Continue with Google
        </Button>

        <p className="text-small text-text-soft mt-8 text-center">
          Already have an account? <Link href="/signin" className="text-amber underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
