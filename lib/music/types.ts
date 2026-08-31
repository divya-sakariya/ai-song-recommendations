export interface SongSuggestion {
  title: string;
  artist: string;
  why: string;
}

export type SongPlatform = "spotify" | "youtube" | "catalog";

export interface ResolvedSong {
  id: string;
  title: string;
  artist: string;
  why: string;
  durationLabel?: string;
  platform: SongPlatform;
  externalUrl: string;
  previewUrl?: string;
  /** SHORTLIST-05: primary platform link was region-locked/unplayable, this is an alternate. */
  regionLocked?: boolean;
  /** SHORTLIST-05: no valid link found on any supported platform. */
  unavailable?: boolean;
}
