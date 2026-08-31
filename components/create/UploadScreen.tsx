"use client";

import { useState } from "react";
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
  const [consenting, setConsenting] = useState(false);

  const hasReadyPhotos = photos.length > 0;
  const hasBlockingPhotos = photos.some((p) => p.status !== "ready");
  const canContinue = hasReadyPhotos && !hasBlockingPhotos;

  async function handleAcceptConsent() {
    setConsenting(true);
    try {
      await fetch("/api/consent", { method: "POST" });
    } finally {
      setConsenting(false);
      setShowConsent(false);
      onContinue(photos);
    }
  }

  return (
    <section aria-labelledby="h1-upload">
      <h1 id="h1-upload" className="text-h1 mb-1.5">
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
      {consenting && (
        <p role="status" className="sr-only">
          Saving your consent…
        </p>
      )}
    </section>
  );
}
