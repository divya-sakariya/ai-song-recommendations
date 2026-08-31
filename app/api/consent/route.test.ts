/**
 * @jest-environment node
 */
import { POST } from "./route";
import { getServerSession } from "next-auth";
import ConsentLog from "@/models/ConsentLog";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/db", () => ({ connectToDatabase: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/models/ConsentLog", () => ({ create: jest.fn().mockResolvedValue({}) }));

const mockGetServerSession = getServerSession as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("POST /api/consent (UPLOAD-04 audit log)", () => {
  it("logs consent for the signed-in user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(ConsentLog.create).toHaveBeenCalledWith({
      userId: "user-1",
      purpose: "ai_mood_analysis",
    });
  });

  it("returns 401 and does not log anything when there is no session (edge case)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST();
    expect(res.status).toBe(401);
    expect(ConsentLog.create).not.toHaveBeenCalled();
  });
});
