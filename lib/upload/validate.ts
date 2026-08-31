import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_PHOTOS } from "./constants";

export interface FileRejection {
  fileName: string;
  reason: string;
}

// UPLOAD-01: rejects unsupported types / oversized files with a specific,
// clear message per limit; enforces the 10-photo batch limit.
export function partitionFiles(
  incoming: File[],
  currentCount: number,
): { accepted: File[]; rejections: FileRejection[] } {
  const accepted: File[] = [];
  const rejections: FileRejection[] = [];
  let remainingSlots = MAX_PHOTOS - currentCount;

  for (const file of incoming) {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      rejections.push({
        fileName: file.name,
        reason: "Unsupported file type. Use JPEG, PNG, or HEIC.",
      });
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejections.push({
        fileName: file.name,
        reason: "File is larger than the 15MB limit.",
      });
      continue;
    }
    if (remainingSlots <= 0) {
      rejections.push({
        fileName: file.name,
        reason: `You can upload up to ${MAX_PHOTOS} photos.`,
      });
      continue;
    }
    accepted.push(file);
    remainingSlots -= 1;
  }

  return { accepted, rejections };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read this file."));
    reader.readAsDataURL(file);
  });
}
