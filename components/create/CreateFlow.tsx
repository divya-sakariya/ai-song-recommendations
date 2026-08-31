"use client";

import { useState } from "react";
import { UploadScreen } from "./UploadScreen";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { ShortlistScreen } from "./ShortlistScreen";
import type { UploadedPhoto } from "@/lib/upload/types";
import type { ResolvedSong } from "@/lib/music/types";

type Step = "upload" | "analyzing" | "shortlist";

export function CreateFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [result, setResult] = useState<{ mood: string; songs: ResolvedSong[] } | null>(null);

  if (step === "analyzing") {
    return (
      <AnalyzingScreen
        photos={photos}
        onSuccess={(r) => {
          setResult(r);
          setStep("shortlist");
        }}
        onGiveUp={() => setStep("upload")}
      />
    );
  }

  if (step === "shortlist" && result) {
    return <ShortlistScreen mood={result.mood} songs={result.songs} />;
  }

  return (
    <UploadScreen
      onContinue={(readyPhotos) => {
        setPhotos(readyPhotos);
        setStep("analyzing");
      }}
    />
  );
}
