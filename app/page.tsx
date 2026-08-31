import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Moment turns a set of photos into an AI-matched song, caption, and exportable Reel.",
};

export default function HomePage() {
  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-h1 mb-3">Moment</h1>
        <p className="text-text-soft text-body mb-8">
          Upload your photos. Get a mood-matched song, a caption, and a Reel — in minutes.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/signin"
            className="min-h-[44px] inline-flex items-center px-5 rounded font-semibold bg-amber text-bg hover:bg-amber-dark"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="min-h-[44px] inline-flex items-center px-5 rounded font-semibold border border-line text-text-soft hover:bg-panel-2"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
