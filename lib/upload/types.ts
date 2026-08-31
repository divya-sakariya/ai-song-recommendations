export interface UploadedPhoto {
  id: string;
  file: File;
  status: "reading" | "ready" | "error";
  dataUrl?: string;
  previewUrl: string;
  error?: string;
}
