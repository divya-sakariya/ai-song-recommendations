"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { partitionFiles, readFileAsDataUrl, type FileRejection } from "@/lib/upload/validate";
import { MAX_PHOTOS } from "@/lib/upload/constants";
import type { UploadedPhoto } from "@/lib/upload/types";
import { Button } from "@/components/ui/Button";

interface PhotoDropzoneProps {
  onPhotosChange: (photos: UploadedPhoto[]) => void;
}

let nextId = 0;

// UPLOAD-01: 1-10 photo upload, JPEG/PNG/HEIC, 15MB/file, thumbnails before
// continuing, and per-file retry on a failed read without disturbing the
// rest of the batch.
export function PhotoDropzone({ onPhotosChange }: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [rejections, setRejections] = useState<FileRejection[]>([]);

  useEffect(() => {
    onPhotosChange(photos);
    // onPhotosChange is a fresh function identity from the parent each
    // render; only re-notify when the photo list itself actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  function startReading(photo: UploadedPhoto) {
    readFileAsDataUrl(photo.file)
      .then((dataUrl) => {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, status: "ready", dataUrl } : p)),
        );
      })
      .catch(() => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, status: "error", error: "Couldn't process this photo. Try again." }
              : p,
          ),
        );
      });
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const { accepted, rejections: newRejections } = partitionFiles(files, photos.length);

    setRejections(newRejections);

    const newPhotos: UploadedPhoto[] = accepted.map((file) => ({
      id: `photo-${nextId++}`,
      file,
      status: "reading",
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    newPhotos.forEach(startReading);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function retryPhoto(photo: UploadedPhoto) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, status: "reading", error: undefined } : p)),
    );
    startReading(photo);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  return (
    <div className="rack bg-panel border border-line rounded-md p-7">
      <div
        className="flex items-center gap-5 flex-wrap"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Button type="button" onClick={() => inputRef.current?.click()}>
          Choose photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          id="photo-input"
          multiple
          accept="image/jpeg,image/png,image/heic,image/heif"
          onChange={handleInputChange}
          className="absolute w-px h-px opacity-0"
          aria-describedby="photo-input-hint"
        />
        <span id="photo-input-hint" className="text-text-soft text-small">
          JPEG / PNG / HEIC · up to {MAX_PHOTOS} · 15MB each. You can also drag photos here.
        </span>
      </div>

      {rejections.length > 0 && (
        <div role="alert" className="mt-4 text-small text-red-400 space-y-1">
          {rejections.map((r, i) => (
            <p key={i} className="flex items-center gap-1.5">
              <span aria-hidden="true">⚠</span> {r.fileName}: {r.reason}
            </p>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <ul className="flex gap-2 flex-wrap mt-5 list-none p-0" aria-label="Uploaded photos">
          {photos.map((photo, i) => (
            <li key={photo.id} className="w-16">
              <div className="relative w-16 h-16 rounded overflow-hidden bg-panel-2 border border-line">
                <Image
                  src={photo.previewUrl}
                  alt={`Uploaded photo ${i + 1} of ${photos.length}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={64}
                  height={64}
                  unoptimized
                />
                {photo.status === "reading" && (
                  <span
                    role="status"
                    className="absolute inset-0 flex items-center justify-center bg-bg/70 text-small text-text-soft"
                  >
                    …
                  </span>
                )}
              </div>
              {photo.status === "error" && (
                <div className="mt-1 space-y-1">
                  <p className="text-small text-red-400">{photo.error}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => retryPhoto(photo)}
                      className="text-small text-amber underline min-h-[44px]"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="text-small text-text-soft underline min-h-[44px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
