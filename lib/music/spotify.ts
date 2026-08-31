interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.accessToken;
}

export interface SpotifyTrackResult {
  id: string;
  title: string;
  artist: string;
  externalUrl: string;
  previewUrl: string | null;
  durationLabel: string;
  /** false when the track is not playable in the target market (region lock). */
  playable: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// SHORTLIST-01/05: live Spotify metadata search, scoped to the India market
// (PRD targets India-based creators) so `is_playable` reflects a real
// region-lock check rather than a global availability flag.
export async function searchSpotifyTrack(query: string): Promise<SpotifyTrackResult | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("market", "IN");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;

  const data = await res.json();
  const track = data?.tracks?.items?.[0];
  if (!track) return null;

  return {
    id: track.id,
    title: track.name,
    artist: (track.artists ?? []).map((a: { name: string }) => a.name).join(", "),
    externalUrl: track.external_urls?.spotify ?? "",
    previewUrl: track.preview_url ?? null,
    durationLabel: formatDuration(track.duration_ms ?? 0),
    playable: track.is_playable !== false,
  };
}
