"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

// UPLOAD-04 (DPDP): consent shown before the first AI processing call,
// requires an active acknowledgment, and declining returns the user to the
// upload screen with their photos intact rather than sending anything.
export function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = "consent-heading";

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDecline();
        return;
      }
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-w-md w-full bg-panel border border-line rounded-md p-7"
      >
        <h2 id={headingId} className="text-h3 mb-3">
          Allow AI processing of your photos?
        </h2>
        <p className="text-body text-text-soft mb-3">
          Your photos will be sent to our AI provider (Google Gemini) to detect mood and suggest
          matching songs. They are processed for this request only and are not retained by the
          provider afterward.
        </p>
        <p className="text-body text-text-soft mb-6">
          You can delete your account and all associated data at any time from Account settings.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={onDecline}>
            Not now
          </Button>
          <Button type="button" onClick={onAccept}>
            I agree, analyze my photos
          </Button>
        </div>
      </div>
    </div>
  );
}
