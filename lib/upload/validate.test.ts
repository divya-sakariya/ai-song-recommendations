import { partitionFiles, readFileAsDataUrl } from "./validate";
import { MAX_FILE_SIZE_BYTES, MAX_PHOTOS } from "./constants";

function makeFile(name: string, type: string, sizeBytes = 100): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("partitionFiles (UPLOAD-01)", () => {
  it("accepts JPEG, PNG, and HEIC files", () => {
    const files = [
      makeFile("a.jpg", "image/jpeg"),
      makeFile("b.png", "image/png"),
      makeFile("c.heic", "image/heic"),
    ];
    const { accepted, rejections } = partitionFiles(files, 0);
    expect(accepted).toHaveLength(3);
    expect(rejections).toHaveLength(0);
  });

  it("rejects unsupported file types with a clear reason", () => {
    const files = [makeFile("doc.pdf", "application/pdf")];
    const { accepted, rejections } = partitionFiles(files, 0);
    expect(accepted).toHaveLength(0);
    expect(rejections).toEqual([
      { fileName: "doc.pdf", reason: "Unsupported file type. Use JPEG, PNG, or HEIC." },
    ]);
  });

  it("rejects files over the 15MB limit with a specific message", () => {
    const files = [makeFile("huge.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1)];
    const { accepted, rejections } = partitionFiles(files, 0);
    expect(accepted).toHaveLength(0);
    expect(rejections[0].reason).toMatch(/15MB/);
  });

  it("accepts a file exactly at the 15MB limit", () => {
    const files = [makeFile("exact.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES)];
    const { accepted, rejections } = partitionFiles(files, 0);
    expect(accepted).toHaveLength(1);
    expect(rejections).toHaveLength(0);
  });

  it("enforces the 10-photo batch limit with a specific message", () => {
    const files = Array.from({ length: 3 }, (_, i) => makeFile(`p${i}.jpg`, "image/jpeg"));
    const { accepted, rejections } = partitionFiles(files, MAX_PHOTOS - 1);
    expect(accepted).toHaveLength(1);
    expect(rejections).toHaveLength(2);
    expect(rejections[0].reason).toMatch(new RegExp(`up to ${MAX_PHOTOS}`));
  });

  it("rejects every file when already at the batch limit", () => {
    const files = [makeFile("p.jpg", "image/jpeg")];
    const { accepted, rejections } = partitionFiles(files, MAX_PHOTOS);
    expect(accepted).toHaveLength(0);
    expect(rejections).toHaveLength(1);
  });
});

describe("readFileAsDataUrl", () => {
  it("resolves with a data URL for a valid file", async () => {
    const file = makeFile("a.jpg", "image/jpeg", 10);
    const result = await readFileAsDataUrl(file);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });
});
