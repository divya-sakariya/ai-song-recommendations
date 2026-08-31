import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignUpForm } from "./SignUpForm";

jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

const mockSignIn = signIn as jest.Mock;
const mockPush = jest.fn();

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as jest.Mock;
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

describe("SignUpForm (AUTH-01)", () => {
  it("registers then signs in and redirects to /create on success", async () => {
    mockFetchOnce(200, { ok: true });
    mockSignIn.mockResolvedValue({ ok: true, error: undefined });

    render(<SignUpForm />);
    await fillAndSubmit();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "new@example.com",
      password: "password123",
      redirect: false,
    });
    expect(mockPush).toHaveBeenCalledWith("/create");
  });

  it("shows the server's error message for a duplicate email and does not attempt sign-in", async () => {
    mockFetchOnce(409, { error: "An account with that email already exists. Try signing in instead." });

    render(<SignUpForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("tells the user their account was created even if the follow-up sign-in fails (edge case)", async () => {
    mockFetchOnce(200, { ok: true });
    mockSignIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

    render(<SignUpForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Account created, but sign-in failed/);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
