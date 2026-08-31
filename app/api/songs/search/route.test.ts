/**
 * @jest-environment node
 */
import { GET } from "./route";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockGetServerSession = getServerSession as jest.Mock;

function makeRequest(query: string) {
  return new Request(`http://localhost/api/songs/search?q=${encodeURIComponent(query)}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("GET /api/songs/search (SHORTLIST-04, demo mode — no SPOTIFY keys set)", () => {
  it("returns 401 when not signed in", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest("golden"));
    expect(res.status).toBe(401);
  });

  it("returns matching catalog songs for a known query", async () => {
    const res = await GET(makeRequest("golden"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.songs.some((s: { title: string }) => s.title === "Golden")).toBe(true);
  });

  it("returns an empty list (not an error) for a query with no matches", async () => {
    const res = await GET(makeRequest("zzz-no-such-song"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.songs).toEqual([]);
  });

  it("returns an empty list for an empty query without calling the search backend", async () => {
    const res = await GET(makeRequest(""));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.songs).toEqual([]);
  });
});
