"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function SignInForm() {
  return (
    <Suspense>
      <SignInFields />
    </Suspense>
  );
}

function SignInFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/create";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      // AUTH-01: invalid credentials show an inline error naming what went
      // wrong and how to retry — never a blank or generic failure.
      setError("No account found with that email and password. Check both and try again.");
      return;
    }

    router.push(callbackUrl);
  }

  async function handleGoogleSignIn() {
    setError(null);
    const result = await signIn("google", { redirect: false, callbackUrl });
    if (result?.error) {
      setError("Google sign-in didn't go through. Please try again.");
    } else if (result?.url) {
      router.push(result.url);
    }
  }

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-h1 mb-1">Sign in</h1>
        <p className="text-text-soft text-body mb-8">Welcome back.</p>

        {error && (
          <p role="alert" className="text-small text-red-400 mb-4 flex items-center gap-1.5">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full mt-6" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
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
          No account?{" "}
          <Link href="/signup" className="text-amber underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
