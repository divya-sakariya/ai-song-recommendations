import type { SongSuggestion } from "./types";

// Local mood-matched fallback catalog. Used when GEMINI_API_KEY is absent
// (so we have no real photo-derived song suggestions) — see
// lib/ai/moodAnalysis.ts. Kept intentionally small; this is a demo-mode
// safety net, not a substitute for the real Spotify/YouTube lookups that
// lib/music/resolveSongs.ts performs whenever those API keys are present.
const CATALOG: Record<string, SongSuggestion[]> = {
  romantic: [
    { title: "Kesariya", artist: "Arijit Singh", why: "Warm, romantic tone fits an intimate moment." },
    { title: "Perfect", artist: "Ed Sheeran", why: "Classic romantic ballad for a tender scene." },
    { title: "Tum Hi Ho", artist: "Arijit Singh", why: "Emotional, devoted mood matches close couple shots." },
  ],
  celebratory: [
    { title: "Ilahi", artist: "Arijit Singh", why: "Upbeat, free-spirited energy for a joyful occasion." },
    { title: "Sunroof", artist: "Nicky Youre", why: "Bright major-key tone fits daylight celebration." },
    { title: "Levitating", artist: "Dua Lipa", why: "High-energy pop for a lively group moment." },
  ],
  calm: [
    { title: "Golden", artist: "Harry Styles", why: "Warm, unhurried tempo matches golden-hour light." },
    { title: "Sunflower", artist: "Post Malone, Swae Lee", why: "Laid-back, mellow feel for a relaxed setting." },
    { title: "Better Together", artist: "Jack Johnson", why: "Gentle acoustic warmth for a quiet moment." },
  ],
  neutral: [
    { title: "Blinding Lights", artist: "The Weeknd", why: "Broadly energetic pick when the mood signal is unclear." },
    { title: "Sunroof", artist: "Nicky Youre", why: "Versatile upbeat tone that fits most everyday moments." },
    { title: "Golden", artist: "Harry Styles", why: "Warm, adaptable feel that suits a variety of photos." },
  ],
};

export function catalogSuggestionsForMood(mood: string): SongSuggestion[] {
  return CATALOG[mood] ?? CATALOG.neutral;
}
