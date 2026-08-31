import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeMood } from "@/lib/ai/moodAnalysis";
import { resolveSongs } from "@/lib/music/resolveSongs";

// ANALYSIS-01: photo(s) -> mood + a resolved, playable song shortlist.
// ANALYSIS-02: any failure here (bad input, Gemini error) becomes a 4xx/5xx
// with a message, which the client turns into an inline retry — never a
// silent hang.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const photos = Array.isArray(body?.photos) ? (body.photos as string[]) : [];

  if (photos.length === 0 || photos.length > 10) {
    return NextResponse.json({ error: "Upload between 1 and 10 photos." }, { status: 400 });
  }

  try {
    const { mood, songSuggestions } = await analyzeMood(photos);
    const songs = await resolveSongs(songSuggestions);
    return NextResponse.json({ mood, songs });
  } catch (err) {
    console.error("Mood analysis failed:", err);
    return NextResponse.json(
      { error: "We couldn't analyze your photos this time." },
      { status: 502 },
    );
  }
}
