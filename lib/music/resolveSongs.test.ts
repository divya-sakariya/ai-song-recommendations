import { resolveSong } from "./resolveSongs";
import { searchSpotifyTrack } from "./spotify";
import { searchYoutubeVideo } from "./youtube";
import { connectToDatabase } from "@/lib/db";
import RegionLockLog from "@/models/RegionLockLog";

jest.mock("./spotify", () => ({ searchSpotifyTrack: jest.fn() }));
jest.mock("./youtube", () => ({
  searchYoutubeVideo: jest.fn(),
  youtubeSearchUrl: (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
}));
jest.mock("@/lib/db", () => ({ connectToDatabase: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/models/RegionLockLog", () => ({ create: jest.fn().mockResolvedValue(undefined) }));

const mockSearchSpotifyTrack = searchSpotifyTrack as jest.Mock;
const mockSearchYoutubeVideo = searchYoutubeVideo as jest.Mock;

const suggestion = { title: "Golden", artist: "Harry Styles", why: "Warm tone." };
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("resolveSong (SHORTLIST-01/05)", () => {
  it("demo mode: returns a catalog/search-link result without calling Spotify when unconfigured", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;

    const result = await resolveSong(suggestion);

    expect(mockSearchSpotifyTrack).not.toHaveBeenCalled();
    expect(result.platform).toBe("catalog");
    expect(result.externalUrl).toContain("open.spotify.com/search");
    expect(result.unavailable).toBeUndefined();
  });

  it("returns a playable Spotify result as-is", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    mockSearchSpotifyTrack.mockResolvedValue({
      id: "sp1",
      title: "Golden",
      artist: "Harry Styles",
      externalUrl: "https://open.spotify.com/track/sp1",
      previewUrl: "https://p.scdn.co/preview/sp1",
      durationLabel: "3:28",
      playable: true,
    });

    const result = await resolveSong(suggestion);

    expect(result.platform).toBe("spotify");
    expect(result.previewUrl).toBe("https://p.scdn.co/preview/sp1");
    expect(result.regionLocked).toBeUndefined();
    expect(result.unavailable).toBeUndefined();
  });

  it("falls back to YouTube and flags regionLocked when Spotify's result isn't playable", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    mockSearchSpotifyTrack.mockResolvedValue({
      id: "sp1",
      title: "Golden",
      artist: "Harry Styles",
      externalUrl: "https://open.spotify.com/track/sp1",
      previewUrl: null,
      durationLabel: "3:28",
      playable: false,
    });
    mockSearchYoutubeVideo.mockResolvedValue({
      id: "yt1",
      title: "Golden",
      channelTitle: "Harry Styles",
      externalUrl: "https://www.youtube.com/watch?v=yt1",
    });

    const result = await resolveSong(suggestion);

    expect(result.platform).toBe("youtube");
    expect(result.regionLocked).toBe(true);
    expect(result.unavailable).toBeUndefined();
    expect(connectToDatabase).toHaveBeenCalled();
    expect(RegionLockLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "region_locked" }),
    );
  });

  it("marks unavailable and logs when neither Spotify nor YouTube has it", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    mockSearchSpotifyTrack.mockResolvedValue(null);
    mockSearchYoutubeVideo.mockResolvedValue(null);

    const result = await resolveSong(suggestion);

    expect(result.unavailable).toBe(true);
    expect(result.platform).toBe("catalog");
    expect(RegionLockLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "unavailable" }),
    );
  });

  it("does not mark unavailable when Spotify has it but is region-locked and YouTube also comes up empty (still gives a working link)", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    mockSearchSpotifyTrack.mockResolvedValue({
      id: "sp1",
      title: "Golden",
      artist: "Harry Styles",
      externalUrl: "https://open.spotify.com/track/sp1",
      previewUrl: null,
      durationLabel: "3:28",
      playable: false,
    });
    mockSearchYoutubeVideo.mockResolvedValue(null);

    const result = await resolveSong(suggestion);

    expect(result.unavailable).toBeUndefined();
    expect(result.regionLocked).toBe(true);
    expect(result.externalUrl).toContain("youtube.com/results");
  });

  it("never throws when the audit log write itself fails (best-effort logging)", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    mockSearchSpotifyTrack.mockResolvedValue(null);
    mockSearchYoutubeVideo.mockResolvedValue(null);
    (RegionLockLog.create as jest.Mock).mockRejectedValue(new Error("db down"));

    await expect(resolveSong(suggestion)).resolves.toMatchObject({ unavailable: true });
  });
});
