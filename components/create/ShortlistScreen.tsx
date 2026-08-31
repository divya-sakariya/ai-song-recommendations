import type { ResolvedSong } from "@/lib/music/types";

interface ShortlistScreenProps {
  mood: string;
  songs: ResolvedSong[];
}

// Minimal placeholder — the real SHORTLIST-01..05 screen (song cards,
// preview, select, manual search, region-lock messaging) replaces this.
// Kept here only so ANALYSIS-01's "transitions to the shortlist screen"
// acceptance criterion is demonstrable end-to-end.
export function ShortlistScreen({ mood, songs }: ShortlistScreenProps) {
  return (
    <section aria-labelledby="h1-shortlist">
      <h1 id="h1-shortlist" className="text-h1 mb-1.5">
        Matches
      </h1>
      <p className="text-text-soft text-body mb-6">Mood detected: {mood}</p>
      <ul className="space-y-3 list-none p-0">
        {songs.map((song) => (
          <li key={song.id} className="border border-line rounded p-4">
            <h3 className="text-h3">{song.title}</h3>
            <p className="text-text-soft text-small">{song.artist}</p>
            <p className="text-teal text-small mt-1">{song.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
