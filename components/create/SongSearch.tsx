"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { ResolvedSong } from "@/lib/music/types";

interface SongSearchProps {
  onSelect: (song: ResolvedSong) => void;
}

// SHORTLIST-04: manual search fallback so a user is never blocked by a bad
// AI recommendation.
export function SongSearch({ onSelect }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<ResolvedSong[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      setResults(data.songs ?? []);
      setStatus("done");
    } catch {
      setStatus("error");
      setResults([]);
    }
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-text-soft text-small py-2 min-h-[44px] flex items-center">
        Search a different track
      </summary>

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2 max-w-[420px] flex-wrap">
        <label htmlFor="song-search" className="sr-only">
          Search by song or artist
        </label>
        <input
          id="song-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by song or artist"
          className="flex-1 min-w-[200px] bg-panel-2 border border-line rounded px-3 py-2.5 text-body text-text"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div role="status" aria-live="polite" className="mt-3">
        {status === "loading" && <p className="text-small text-text-soft">Searching…</p>}
        {status === "error" && (
          <p className="text-small text-red-400 flex items-center gap-1.5">
            <span aria-hidden="true">⚠</span> Search failed. Try again.
          </p>
        )}
        {status === "done" && results.length === 0 && (
          <p className="text-small text-text-soft">No matches. Try different terms.</p>
        )}
      </div>

      {results.length > 0 && (
        <ul className="list-none p-0 mt-3 space-y-2" aria-label="Search results">
          {results.map((song) => (
            <li
              key={song.id}
              className="flex items-center justify-between gap-3 border border-line rounded px-3.5 py-2.5 flex-wrap"
            >
              <div>
                <p className="text-body">{song.title}</p>
                <p className="text-small text-text-soft">{song.artist}</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => onSelect(song)}>
                Select
              </Button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
