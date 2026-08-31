export interface YoutubeResult {
  id: string;
  title: string;
  channelTitle: string;
  externalUrl: string;
}

// SHORTLIST-05: alternate-platform link when the primary (Spotify) result is
// region-locked or missing. Without YOUTUBE_API_KEY set, falls back to a
// plain search URL — a working link, just without verified/exact metadata.
export async function searchYoutubeVideo(query: string): Promise<YoutubeResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const item = data?.items?.[0];
  if (!item) return null;

  return {
    id: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    externalUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  };
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
