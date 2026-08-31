"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UploadedPhoto } from "@/lib/upload/types";
import type { ResolvedSong } from "@/lib/music/types";

interface AnalyzingScreenProps {
  photos: UploadedPhoto[];
  onSuccess: (result: { mood: string; songs: ResolvedSong[] }) => void;
  onGiveUp: () => void;
}

const SLOW_THRESHOLD_MS = 8000;
const MAX_RETRIES = 2;

// ANALYSIS-01: fires automatically on entering this screen, announces
// progress via a live region within 1s.
// ANALYSIS-02: switches to a "taking longer" message past the 8s budget,
// and after 2 failed retries stops offering Retry in favor of going back.
export function AnalyzingScreen({ photos, onSuccess, onGiveUp }: AnalyzingScreenProps) {
  const [status, setStatus] = useState<"analyzing" | "slow" | "error">("analyzing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("analyzing");
    setErrorMessage(null);

    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus("slow");
    }, SLOW_THRESHOLD_MS);

    fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: photos.map((p) => p.dataUrl) }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "We couldn't analyze your photos.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) onSuccess(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "We couldn't analyze your photos.");
        }
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (status === "error") {
    const canRetry = attempt < MAX_RETRIES;
    return (
      <section aria-labelledby="h1-analysis-error">
        <h1 id="h1-analysis-error" className="text-h1 mb-3">
          Analysis failed
        </h1>
        <p role="alert" className="text-body text-red-400 mb-6 flex items-center gap-1.5">
          <span aria-hidden="true">⚠</span> {errorMessage}
        </p>
        <div className="flex gap-3">
          {canRetry && (
            <Button type="button" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </Button>
          )}
          <Button variant="secondary" type="button" onClick={onGiveUp}>
            Back to upload
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="h1-analyzing">
      <p role="status" aria-live="polite" className="mono text-teal text-small mb-3">
        {status === "slow"
          ? "STILL ANALYZING… THIS IS TAKING LONGER THAN USUAL"
          : "ANALYZING…"}
      </p>
      <h1 id="h1-analyzing" className="text-h1 mb-1.5">
        Reading the room
      </h1>
      <p className="text-text-soft text-body max-w-[60ch]">
        We&apos;re scoring the mood of your photos and pulling matching tracks.
      </p>
    </section>
  );
}
