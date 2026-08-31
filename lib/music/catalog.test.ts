import { catalogSuggestionsForMood, searchCatalog } from "./catalog";

describe("catalogSuggestionsForMood", () => {
  it("returns suggestions for a known mood", () => {
    const result = catalogSuggestionsForMood("romantic");
    expect(result.length).toBeGreaterThan(0);
    for (const s of result) {
      expect(s.title).toBeTruthy();
      expect(s.artist).toBeTruthy();
      expect(s.why).toBeTruthy();
    }
  });

  it("falls back to the neutral list for an unknown mood (ANALYSIS-01 degrade-gracefully edge case)", () => {
    const unknown = catalogSuggestionsForMood("some-unrecognized-mood");
    expect(unknown).toEqual(catalogSuggestionsForMood("neutral"));
  });
});

describe("searchCatalog (SHORTLIST-04 demo-mode fallback)", () => {
  it("matches by title, case-insensitively", () => {
    const results = searchCatalog("GOLDEN");
    expect(results.some((s) => s.title === "Golden")).toBe(true);
  });

  it("matches by artist", () => {
    const results = searchCatalog("arijit singh");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.artist.toLowerCase().includes("arijit singh"))).toBe(true);
  });

  it("returns no results for a nonsense query (edge case)", () => {
    expect(searchCatalog("zzz-not-a-real-song-xyz")).toEqual([]);
  });

  it("returns no results for an empty/whitespace query", () => {
    expect(searchCatalog("   ")).toEqual([]);
  });

  it("de-duplicates a song that appears in multiple mood buckets", () => {
    const results = searchCatalog("golden");
    const keys = results.map((s) => `${s.title}|${s.artist}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
