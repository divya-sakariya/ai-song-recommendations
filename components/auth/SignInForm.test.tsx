import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInForm } from "./SignInForm";

jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockSignIn = signIn as jest.Mock;
const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

describe("SignInForm (AUTH-01)", () => {
  it("redirects to /create on successful sign-in", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: undefined });
    render(<SignInForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirect: false,
    });
    expect(mockPush).toHaveBeenCalledWith("/create");
  });

  it("shows a specific inline error for invalid credentials, naming what went wrong (AUTH-01 edge case)", async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });
    render(<SignInForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/No account found/);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to the callbackUrl from the query string when present", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("callbackUrl=/create"));
    mockSignIn.mockResolvedValue({ ok: true, error: undefined });
    render(<SignInForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockPush).toHaveBeenCalledWith("/create");
  });

  it("shows an inline error when Google sign-in fails to go through", async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: "OAuthSignin" });
    render(<SignInForm />);

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't go through/);
  });
});
