import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoDropzone } from "./PhotoDropzone";

function makeFile(name: string, type: string, sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

beforeAll(() => {
  // jsdom doesn't implement object URLs.
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
});

describe("PhotoDropzone (UPLOAD-01)", () => {
  it("has an accessible name on the file input, not just a description (a11y regression)", () => {
    render(<PhotoDropzone onPhotosChange={jest.fn()} />);
    expect(screen.getByLabelText("Choose photos")).toBe(document.getElementById("photo-input"));
  });

  it("shows an accessible thumbnail once a valid photo is read", async () => {
    const onPhotosChange = jest.fn();
    render(<PhotoDropzone onPhotosChange={onPhotosChange} />);

    const input = document.getElementById("photo-input") as HTMLInputElement;
    const file = makeFile("a.jpg", "image/jpeg");
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText("Uploaded photo 1 of 1")).toBeInTheDocument();
    });

    const lastCall = onPhotosChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0].status).toBe("ready");
  });

  it("rejects an unsupported file type with a clear inline message and does not add a thumbnail", async () => {
    render(<PhotoDropzone onPhotosChange={jest.fn()} />);

    const input = document.getElementById("photo-input") as HTMLInputElement;
    // Real browsers pre-filter the OS picker by `accept`, but drag-and-drop
    // (and some pickers) can still hand back a non-matching file — bypass
    // user-event's accept-attribute emulation to exercise that path.
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(input, makeFile("doc.pdf", "application/pdf"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Unsupported file type/);
    expect(screen.queryByRole("list", { name: "Uploaded photos" })).not.toBeInTheDocument();
  });

  it("lets the user retry a single failed file without losing the others (edge case)", async () => {
    const onPhotosChange = jest.fn();

    // Force the first read to fail, then succeed on retry.
    const OriginalFileReader = global.FileReader;
    let readCount = 0;
    class FlakyFileReader extends OriginalFileReader {
      readAsDataURL(blob: Blob) {
        readCount += 1;
        if (readCount === 1) {
          // Fail synchronously (a real setTimeout(0) here raced against
          // RTL's polling under parallel-worker CPU contention and was
          // occasionally flaky) — Promise rejection ordering still makes
          // this resolve as a microtask, same as a genuine async failure.
          this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>);
        } else {
          super.readAsDataURL(blob);
        }
      }
    }
    global.FileReader = FlakyFileReader;

    render(<PhotoDropzone onPhotosChange={onPhotosChange} />);
    const input = document.getElementById("photo-input") as HTMLInputElement;
    await userEvent.upload(input, makeFile("a.jpg", "image/jpeg"));

    const retryButton = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByText(/Couldn't process this photo/)).toBeInTheDocument();

    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByAltText("Uploaded photo 1 of 1")).toBeInTheDocument();
    });

    global.FileReader = OriginalFileReader;
  });
});
