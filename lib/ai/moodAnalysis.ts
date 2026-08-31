import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SongSuggestion } from "@/lib/music/types";
import { catalogSuggestionsForMood } from "@/lib/music/catalog";

export interface MoodAnalysisResult {
  mood: string;
  songSuggestions: SongSuggestion[];
  /** true when this ran without a real Gemini call (no GEMINI_API_KEY set). */
  demoMode: boolean;
}

const PROMPT = `You are analyzing photos for a Reel-making app aimed at Indian wedding/travel/lifestyle
content creators. Look at the mood, setting, and lighting of the attached photo(s).

Respond with ONLY minified JSON matching this exact shape, no prose, no markdown fences:
{"mood":"one or two word mood label, or \\"neutral\\" if no clear mood signal (e.g. blank wall, screenshot, document)","songs":[{"title":"song title","artist":"artist name","why":"one sentence, <=15 words, on why this song fits the mood/setting"}]}

Return exactly 4 songs. Prefer a mix of Bollywood/Indian and Western tracks that would resonate with
an Indian creator's audience. If the photo has no discernible mood, use "neutral" and suggest broadly
likeable, versatile songs rather than guessing a specific mood.`;

function dataUrlToInlinePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid photo data.");
  const [, mimeType, data] = match;
  return { inlineData: { mimeType, data } };
}

async function callGemini(photoDataUrls: string[]): Promise<{ mood: string; songs: SongSuggestion[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no api key");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const imageParts = photoDataUrls.slice(0, 10).map(dataUrlToInlinePart);
  const result = await model.generateContent([PROMPT, ...imageParts]);
  const text = result.response.text();

  const parsed = JSON.parse(text) as { mood?: string; songs?: SongSuggestion[] };
  if (!parsed.mood || !Array.isArray(parsed.songs) || parsed.songs.length === 0) {
    throw new Error("Gemini returned an unexpected response shape.");
  }

  return { mood: parsed.mood.toLowerCase(), songs: parsed.songs };
}

// ANALYSIS-01: photo(s) -> mood + song suggestions with "why" text, via
// Gemini vision (PRD Section 8, Decision 6). Without GEMINI_API_KEY set,
// runs in a clearly-labeled demo mode using a local mood catalog instead of
// a live model call — see .env.example.
export async function analyzeMood(photoDataUrls: string[]): Promise<MoodAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { mood: "neutral", songSuggestions: catalogSuggestionsForMood("neutral"), demoMode: true };
  }

  const { mood, songs } = await callGemini(photoDataUrls);
  return { mood, songSuggestions: songs, demoMode: false };
}
