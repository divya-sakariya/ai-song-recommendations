/**
 * @jest-environment node
 */
import { POST } from "./route";
import { getServerSession } from "next-auth";
import { analyzeMood } from "@/lib/ai/moodAnalysis";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
// Wrap the real implementation so most tests exercise the actual demo-mode
// pipeline; only the failure-path test overrides it for one call.
jest.mock("@/lib/ai/moodAnalysis", () => {
  const actual = jest.requireActual("@/lib/ai/moodAnalysis");
  return { analyzeMood: jest.fn(actual.analyzeMood) };
});

const mockGetServerSession = getServerSession as jest.Mock;
const samplePhoto = "data:image/png;base64,AAAA";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/analysis", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("POST /api/analysis (ANALYSIS-01/02, demo mode — no GEMINI/SPOTIFY keys set)", () => {
  it("returns 401 when not signed in", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ photos: [samplePhoto] }));
    expect(res.status).toBe(401);
  });

  it("rejects an empty photo list", async () => {
    const res = await POST(makeRequest({ photos: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/1 and 10/);
  });

  it("rejects more than 10 photos", async () => {
    const res = await POST(makeRequest({ photos: Array(11).fill(samplePhoto) }));
    expect(res.status).toBe(400);
  });

  it("runs the full pipeline end-to-end in demo mode and returns a mood + resolved shortlist", async () => {
    const res = await POST(makeRequest({ photos: [samplePhoto] }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.mood).toBe("string");
    expect(Array.isArray(data.songs)).toBe(true);
    expect(data.songs.length).toBeGreaterThan(0);
    for (const song of data.songs) {
      expect(song.title).toBeTruthy();
      expect(song.artist).toBeTruthy();
      expect(song.why).toBeTruthy();
      expect(song.externalUrl).toBeTruthy();
    }
  });

  it("returns 502 with an inline-able error message when the provider call fails (ANALYSIS-02)", async () => {
    (analyzeMood as jest.Mock).mockRejectedValueOnce(new Error("provider down"));

    const res = await POST(makeRequest({ photos: [samplePhoto] }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBeTruthy();
  });
});
