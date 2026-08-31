"use client";

import { useEffect, useRef } from "react";
import type { ResolvedSong } from "@/lib/music/types";

interface SongCardProps {
  song: ResolvedSong;
  selected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreviewToggle: () => void;
}

// SHORTLIST-01/02/03/05: one song's card — title/artist/why, a preview
// action (in-app clip or an external open where no clip is licensed), and a
// select action whose state is shown via icon + text + color together.
export function SongCard({ song, selected, isPlaying, onSelect, onPreviewToggle }: SongCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canPreviewInApp = Boolean(song.previewUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  function handlePreviewClick() {
    if (song.unavailable) return;
    if (canPreviewInApp) {
      onPreviewToggle();
    } else {
      window.open(song.externalUrl, "_blank", "noopener,noreferrer");
    }
  }

  const previewLabel = song.unavailable
    ? "Preview unavailable"
    : canPreviewInApp
      ? isPlaying
        ? "Stop preview"
        : "▷ Preview"
      : `Open on ${song.platform === "youtube" ? "YouTube" : "Spotify"}`;

  return (
    <li className="flex items-center gap-5 bg-panel border border-line rounded-md px-5 py-4 flex-wrap">
      {song.durationLabel && (
        <span className="mono text-small text-text-soft w-16 text-right shrink-0">
          {song.durationLabel}
        </span>
      )}
      <div className="flex-[1.6] min-w-[200px]">
        <h3 className="text-h3">{song.title}</h3>
        <p className="text-text-soft text-small mb-2">{song.artist}</p>
        <p className="text-teal text-small max-w-[44ch]">
          <span className="font-bold text-text-soft">Why: </span>
          {song.why}
        </p>
        {song.unavailable && (
          <p className="text-red-400 text-small mt-1.5 flex items-center gap-1.5" role="alert">
            <span aria-hidden="true">⚠</span> Not available in your region right now — pick another
            track below.
          </p>
        )}
        {song.regionLocked && !song.unavailable && (
          <p className="text-text-soft text-small mt-1.5">
            Region-restricted on Spotify — showing the YouTube link instead.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 min-w-[140px]">
        <button
          type="button"
          onClick={handlePreviewClick}
          disabled={song.unavailable}
          aria-pressed={canPreviewInApp ? isPlaying : undefined}
          className="min-h-[44px] px-3.5 text-small bg-panel-2 border border-line text-text-soft rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previewLabel}
        </button>
        <button
          type="button"
          onClick={onSelect}
          disabled={song.unavailable}
          aria-pressed={selected}
          className={`min-h-[44px] px-3.5 text-small rounded border font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
            selected ? "bg-amber text-bg border-amber" : "border-amber text-amber bg-transparent"
          }`}
        >
          {selected ? "✓ Selected" : "Select"}
        </button>
      </div>
      {canPreviewInApp && (
        <audio ref={audioRef} src={song.previewUrl} onEnded={onPreviewToggle} preload="none" />
      )}
    </li>
  );
}
