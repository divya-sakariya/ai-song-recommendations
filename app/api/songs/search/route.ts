import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchSpotifyTracks } from "@/lib/music/spotify";
import { searchCatalog } from "@/lib/music/catalog";
import type { ResolvedSong } from "@/lib/music/types";

// SHORTLIST-04: manual search fallback, querying the same metadata source
// used for the AI shortlist (Spotify when configured, the local catalog in
// demo mode — see .env.example / lib/music/resolveSongs.ts).
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ songs: [] });
  }

  const spotifyConfigured = Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );

  if (spotifyConfigured) {
    const tracks = await searchSpotifyTracks(q, 6);
    const songs: ResolvedSong[] = tracks
      .filter((t) => t.playable)
      .map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        why: "Added from search",
        durationLabel: t.durationLabel,
        platform: "spotify",
        externalUrl: t.externalUrl,
        previewUrl: t.previewUrl ?? undefined,
      }));
    return NextResponse.json({ songs });
  }

  const songs: ResolvedSong[] = searchCatalog(q).map((s) => ({
    id: crypto.randomUUID(),
    title: s.title,
    artist: s.artist,
    why: "Added from search",
    platform: "catalog",
    externalUrl: `https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist}`)}`,
  }));
  return NextResponse.json({ songs });
}
