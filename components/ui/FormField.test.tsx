import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("FormField (ACCESS-04 baseline: labels + errors tied via aria-describedby)", () => {
  it("associates the label with the input via htmlFor/id", () => {
    render(<FormField id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("ties an error message to the input via aria-describedby, not as disconnected text", () => {
    render(<FormField id="email" label="Email" error="Enter a valid email." />);
    const input = screen.getByLabelText("Email");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain("email-error");
    expect(document.getElementById("email-error")).toHaveTextContent("Enter a valid email.");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when there is no error", () => {
    render(<FormField id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });
});
