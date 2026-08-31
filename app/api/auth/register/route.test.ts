/**
 * @jest-environment node
 */
import { POST } from "./route";
import User from "@/models/User";

jest.mock("@/lib/db", () => ({ connectToDatabase: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed-password") }));

const mockFindOne = User.findOne as jest.Mock;
const mockCreate = User.create as jest.Mock;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/auth/register (AUTH-01)", () => {
  it("creates an account with a hashed password, never storing plaintext", async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});

    const res = await POST(makeRequest({ email: "New@Example.com", password: "password123", name: "Nova" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com", passwordHash: "hashed-password" }),
    );
    const createArg = mockCreate.mock.calls[0][0];
    expect(createArg.password).toBeUndefined();
  });

  it("rejects an invalid email with a 400 and a clear message", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "password123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/valid email/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a password under 8 characters", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "short" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/8 characters/);
  });

  it("returns 409 for a duplicate email instead of overwriting the existing account", async () => {
    mockFindOne.mockResolvedValue({ email: "dup@example.com" });

    const res = await POST(makeRequest({ email: "dup@example.com", password: "password123" }));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already exists/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed request body (edge case)", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
