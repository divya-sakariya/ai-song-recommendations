"use client";

import { UploadScreen } from "@/components/create/UploadScreen";

// Wired to the full create flow (analysis + shortlist) in ANALYSIS-01.
export default function CreatePage() {
  return (
    <main id="main" className="max-w-[900px] mx-auto px-10 py-10 pb-24">
      <UploadScreen onContinue={() => {}} />
    </main>
  );
}
