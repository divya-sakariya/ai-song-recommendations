import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentModal } from "./ConsentModal";

describe("ConsentModal (UPLOAD-04)", () => {
  it("is a labelled, modal dialog with focus moved into it on open", () => {
    render(<ConsentModal onAccept={jest.fn()} onDecline={jest.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName(/Allow AI processing/);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Not now" }));
  });

  it("requires an explicit click to accept before proceeding", async () => {
    const onAccept = jest.fn();
    render(<ConsentModal onAccept={onAccept} onDecline={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /I agree/ }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("declining calls onDecline without ever calling onAccept", async () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(<ConsentModal onAccept={onAccept} onDecline={onDecline} />);

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("Escape declines (edge case: dismiss without an explicit button click)", async () => {
    const onDecline = jest.fn();
    render(<ConsentModal onAccept={jest.fn()} onDecline={onDecline} />);

    await userEvent.keyboard("{Escape}");
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
