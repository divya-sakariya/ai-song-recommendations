import crypto from "crypto";
import { searchSpotifyTrack } from "./spotify";
import { searchYoutubeVideo, youtubeSearchUrl } from "./youtube";
import { connectToDatabase } from "@/lib/db";
import RegionLockLog from "@/models/RegionLockLog";
import type { ResolvedSong, SongSuggestion } from "./types";

async function logRegionIssue(title: string, artist: string, reason: "region_locked" | "unavailable") {
  try {
    await connectToDatabase();
    await RegionLockLog.create({ title, artist, reason });
  } catch {
    // Best-effort audit log only — never block the shortlist on this.
  }
}

function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

// SHORTLIST-01/05: resolves one Gemini-suggested {title, artist, why} into a
// real, playable link. Tries Spotify first (scoped to the India market);
// falls back to YouTube as the alternate platform when Spotify's result is
// region-locked or missing; falls back to a best-effort search link and
// logs the miss when neither platform has it.
export async function resolveSong(suggestion: SongSuggestion): Promise<ResolvedSong> {
  const query = `${suggestion.title} ${suggestion.artist}`;
  const spotifyConfigured = Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );

  if (!spotifyConfigured) {
    // No live catalog access configured — demo mode, not a real
    // availability check. See .env.example.
    return {
      id: crypto.randomUUID(),
      title: suggestion.title,
      artist: suggestion.artist,
      why: suggestion.why,
      platform: "catalog",
      externalUrl: spotifySearchUrl(query),
    };
  }

  const spotify = await searchSpotifyTrack(query);

  if (spotify && spotify.playable) {
    return {
      id: spotify.id,
      title: spotify.title,
      artist: spotify.artist,
      why: suggestion.why,
      durationLabel: spotify.durationLabel,
      platform: "spotify",
      externalUrl: spotify.externalUrl,
      previewUrl: spotify.previewUrl ?? undefined,
    };
  }

  if (spotify && !spotify.playable) {
    await logRegionIssue(suggestion.title, suggestion.artist, "region_locked");
  }

  const youtube = await searchYoutubeVideo(query);
  if (youtube) {
    return {
      id: youtube.id,
      title: suggestion.title,
      artist: suggestion.artist,
      why: suggestion.why,
      platform: "youtube",
      externalUrl: youtube.externalUrl,
      regionLocked: Boolean(spotify),
    };
  }

  if (!spotify) {
    await logRegionIssue(suggestion.title, suggestion.artist, "unavailable");
    return {
      id: crypto.randomUUID(),
      title: suggestion.title,
      artist: suggestion.artist,
      why: suggestion.why,
      platform: "catalog",
      externalUrl: youtubeSearchUrl(query),
      unavailable: true,
    };
  }

  // Spotify has it but it's region-locked, and YouTube's API found nothing
  // (or isn't configured) — still hand back a working search link.
  return {
    id: crypto.randomUUID(),
    title: suggestion.title,
    artist: suggestion.artist,
    why: suggestion.why,
    platform: "youtube",
    externalUrl: youtubeSearchUrl(query),
    regionLocked: true,
  };
}

export async function resolveSongs(suggestions: SongSuggestion[]): Promise<ResolvedSong[]> {
  return Promise.all(suggestions.map(resolveSong));
}
