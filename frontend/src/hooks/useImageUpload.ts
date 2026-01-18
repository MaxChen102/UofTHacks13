"use client";

import * as React from "react";
import { useUploadThing } from "@/lib/uploadthing";

export type ImageUploadStatus = "idle" | "uploading" | "success" | "error";

export type UploadedImage = {
  url: string;
  key?: string;
  name: string;
  size: number;
  type: string;
};


export type UseImageUploadOptions = {
  endpoint?: "imageUploader";
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
};

function defaultAllowedImageTypes() {
  return [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ] as const;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    endpoint = "imageUploader",
    maxSizeBytes = 8 * 1024 * 1024,
    allowedMimeTypes = defaultAllowedImageTypes(),
  } = options;

  const [status, setStatus] = React.useState<ImageUploadStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [uploaded, setUploaded] = React.useState<UploadedImage | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadError: (e) => {
      setStatus("error");
      setError(e?.message ?? "Upload failed");
    },
  });

  const reset = React.useCallback(() => {
    setStatus("idle");
    setError(null);
    setUploaded(null);
  }, []);

  const validate = React.useCallback(
    (file: File) => {
      if (!file) throw new Error("No file selected");
      if (file.size > maxSizeBytes) {
        throw new Error(
          `File too large (${Math.ceil(file.size / 1024 / 1024)}MB). Max is ${Math.ceil(
            maxSizeBytes / 1024 / 1024
          )}MB.`
        );
      }
      const ok =
        file.type?.startsWith("image/") &&
        (allowedMimeTypes.length === 0 ||
          allowedMimeTypes.includes(file.type));
      if (!ok) {
        throw new Error(
          `Unsupported file type (${file.type || "unknown"}). Allowed: ${allowedMimeTypes.length ? allowedMimeTypes.join(", ") : "image/*"
          }`
        );
      }
    },
    [allowedMimeTypes, maxSizeBytes]
  );

  const upload = React.useCallback(
    async (file: File): Promise<UploadedImage> => {
      setError(null);
      setStatus("uploading");

      try {
        validate(file);

        const res = await startUpload([file]);
        const first: unknown = (res ?? [])[0];

        if (!first || typeof first !== "object") {
          throw new Error("Upload succeeded but no file data was returned");
        }

        const fileData = first as { ufsUrl?: string; url?: string; key?: string };
        const url: string | undefined = fileData.ufsUrl ?? fileData.url;
        const key: string | undefined = fileData.key;

        if (!url) throw new Error("Upload succeeded but no URL was returned");

        const out: UploadedImage = {
          url,
          key,
          name: file.name,
          size: file.size,
          type: file.type,
        };

        setUploaded(out);
        setStatus("success");
        return out;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setError(message);
        setStatus("error");
        throw e;
      }
    },
    [startUpload, validate]
  );

  return {
    status,
    isUploading: isUploading || status === "uploading",
    error,
    uploaded,
    upload,
    reset,
    validate,
  };
}
