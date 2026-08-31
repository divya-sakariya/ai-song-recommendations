import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadScreen } from "./UploadScreen";

function makeFile(name: string, type: string): File {
  return new File([new Uint8Array(10)], name, { type });
}

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
});

async function uploadOnePhoto() {
  const input = document.getElementById("photo-input") as HTMLInputElement;
  await userEvent.upload(input, makeFile("a.jpg", "image/jpeg"));
  await screen.findByAltText("Uploaded photo 1 of 1");
}

describe("UploadScreen (UPLOAD-01/04)", () => {
  it("disables Continue until a photo has finished processing", async () => {
    render(<UploadScreen onContinue={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Run analysis" })).toBeDisabled();

    await uploadOnePhoto();
    expect(screen.getByRole("button", { name: "Run analysis" })).toBeEnabled();
  });

  it("requires consent before calling onContinue, and declining preserves photos without calling it", async () => {
    const onContinue = jest.fn();
    render(<UploadScreen onContinue={onContinue} />);
    await uploadOnePhoto();

    await userEvent.click(screen.getByRole("button", { name: "Run analysis" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Photo is still there — declining didn't wipe the upload.
    expect(screen.getByAltText("Uploaded photo 1 of 1")).toBeInTheDocument();
  });

  it("proceeds to onContinue immediately on accept, without waiting on the consent-log network call", async () => {
    // A fetch that never resolves simulates an unreachable DB — the fix
    // under test is that this must not block progression (previously an
    // `await` here could stall the user for Mongoose's ~30s connect timeout).
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    const onContinue = jest.fn();

    render(<UploadScreen onContinue={onContinue} />);
    await uploadOnePhoto();
    await userEvent.click(screen.getByRole("button", { name: "Run analysis" }));
    await userEvent.click(screen.getByRole("button", { name: /I agree/ }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/consent", { method: "POST" });
  });
});
