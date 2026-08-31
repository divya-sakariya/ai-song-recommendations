"use client";

import { useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";
import { SongSearch } from "./SongSearch";
import { Button } from "@/components/ui/Button";
import type { ResolvedSong } from "@/lib/music/types";

interface ShortlistScreenProps {
  mood: string;
  songs: ResolvedSong[];
}

// SHORTLIST-01..05: 3-5 AI-suggested songs with "why" text, preview,
// single-selection, a manual search fallback, and region-lock handling
// (resolved server-side in lib/music/resolveSongs.ts).
export function ShortlistScreen({ mood, songs: initialSongs }: ShortlistScreenProps) {
  const [songs, setSongs] = useState<ResolvedSong[]>(initialSongs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // See the identical comment in UploadScreen.tsx: moves focus here when
  // CreateFlow mounts this screen, instead of leaving it at <body>.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function handleSearchSelect(song: ResolvedSong) {
    setSongs((prev) => (prev.some((s) => s.id === song.id) ? prev : [...prev, song]));
    setSelectedId(song.id);
  }

  return (
    <section aria-labelledby="h1-shortlist">
      <h1 ref={headingRef} tabIndex={-1} id="h1-shortlist" className="text-h1 mb-1.5">
        Matches
      </h1>
      <p className="text-text-soft text-body mb-8 max-w-[60ch]">
        Ranked by fit to your photos. Mood detected: {mood}.
      </p>

      <ul className="space-y-2.5 list-none p-0 m-0" aria-label="Song shortlist">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            selected={selectedId === song.id}
            isPlaying={playingId === song.id}
            onSelect={() => setSelectedId(song.id)}
            onPreviewToggle={() => setPlayingId((current) => (current === song.id ? null : song.id))}
          />
        ))}
      </ul>

      <SongSearch onSelect={handleSearchSelect} />

      <div className="flex gap-3 mt-9">
        <Button
          type="button"
          disabled={!selectedId}
          onClick={() => {
            // CAPTION-01 (Milestone 2) picks up from here with the selected song.
          }}
        >
          Continue to captions
        </Button>
      </div>
    </section>
  );
}
