import { analyzeMood } from "./moodAnalysis";

const mockGenerateContent = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
  })),
}));

const ORIGINAL_ENV = process.env;
const samplePhoto = "data:image/png;base64,AAAA";

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("analyzeMood (ANALYSIS-01/02)", () => {
  it("demo mode: returns a neutral shortlist without calling Gemini when GEMINI_API_KEY is unset", async () => {
    delete process.env.GEMINI_API_KEY;

    const result = await analyzeMood([samplePhoto]);

    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(result.demoMode).toBe(true);
    expect(result.mood).toBe("neutral");
    expect(result.songSuggestions.length).toBeGreaterThan(0);
  });

  it("returns Gemini's parsed mood and songs when configured and successful", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            mood: "Romantic",
            songs: [{ title: "Perfect", artist: "Ed Sheeran", why: "Tender ballad." }],
          }),
      },
    });

    const result = await analyzeMood([samplePhoto]);

    expect(result.demoMode).toBe(false);
    expect(result.mood).toBe("romantic");
    expect(result.songSuggestions).toEqual([
      { title: "Perfect", artist: "Ed Sheeran", why: "Tender ballad." },
    ]);
  });

  it("degrades to a neutral mood when Gemini itself reports no clear signal (edge case: blank/ambiguous photo)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            mood: "neutral",
            songs: [{ title: "Blinding Lights", artist: "The Weeknd", why: "Broadly likeable." }],
          }),
      },
    });

    const result = await analyzeMood([samplePhoto]);
    expect(result.mood).toBe("neutral");
    expect(result.demoMode).toBe(false);
  });

  it("throws (rather than silently falling back) when Gemini's response is malformed JSON", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValue({ response: { text: () => "not json" } });

    await expect(analyzeMood([samplePhoto])).rejects.toThrow();
  });

  it("throws when Gemini's response is missing the required fields", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ mood: "romantic" }) },
    });

    await expect(analyzeMood([samplePhoto])).rejects.toThrow(/unexpected response shape/);
  });

  it("propagates a provider error so the caller's retry path can handle it (ANALYSIS-02)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockRejectedValue(new Error("rate limited"));

    await expect(analyzeMood([samplePhoto])).rejects.toThrow("rate limited");
  });
});
