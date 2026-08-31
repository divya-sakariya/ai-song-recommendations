"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoDropzone } from "./PhotoDropzone";
import { ConsentModal } from "./ConsentModal";
import { Button } from "@/components/ui/Button";
import type { UploadedPhoto } from "@/lib/upload/types";

interface UploadScreenProps {
  onContinue: (photos: UploadedPhoto[]) => void;
}

export function UploadScreen({ onContinue }: UploadScreenProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [showConsent, setShowConsent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Moves focus to this screen's heading whenever it mounts (including
  // returning here from an analysis failure), so a keyboard/screen-reader
  // user's focus doesn't silently reset to <body> when CreateFlow swaps
  // which step is rendered.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const hasReadyPhotos = photos.length > 0;
  const hasBlockingPhotos = photos.some((p) => p.status !== "ready");
  const canContinue = hasReadyPhotos && !hasBlockingPhotos;

  function handleAcceptConsent() {
    // Best-effort audit log (UPLOAD-04/DPDP) — fire-and-forget so a slow or
    // unreachable DB never blocks the user's progress into analysis, which
    // an `await` here previously did (up to Mongoose's connection timeout).
    fetch("/api/consent", { method: "POST" }).catch(() => {});
    setShowConsent(false);
    onContinue(photos);
  }

  return (
    <section aria-labelledby="h1-upload">
      <h1 ref={headingRef} tabIndex={-1} id="h1-upload" className="text-h1 mb-1.5">
        New session
      </h1>
      <p className="text-text-soft text-body mb-9 max-w-[60ch]">
        Load your photos in. We&apos;ll score the mood and pull matching tracks.
      </p>

      <PhotoDropzone onPhotosChange={setPhotos} />

      <div className="flex gap-3 mt-9">
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => setShowConsent(true)}
        >
          Run analysis
        </Button>
      </div>

      {showConsent && (
        <ConsentModal
          onAccept={handleAcceptConsent}
          onDecline={() => setShowConsent(false)}
        />
      )}
    </section>
  );
}
