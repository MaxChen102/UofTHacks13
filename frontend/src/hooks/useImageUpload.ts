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
          allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number]));
      if (!ok) {
        throw new Error(
          `Unsupported file type (${file.type || "unknown"}). Allowed: ${
            allowedMimeTypes.length ? allowedMimeTypes.join(", ") : "image/*"
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
        if (!res || (Array.isArray(res) && res.length === 0)) {
          // UploadThing can return an empty array if server-side auth/env fails.
          // Provide a helpful message and a dev-friendly fallback so the app stays usable.
          const hint =
            "UploadThing returned an empty response. This usually means UploadThing env vars are missing " +
            "(UPLOADTHING_SECRET / UPLOADTHING_APP_ID) or the /api/uploadthing route is failing auth. " +
            "Check your Next.js server logs and ensure you're signed in.";

          // DEV FALLBACK: use a local data URL so the pin flow can continue without UploadThing configured.
          // This is not suitable for production.
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          });

          const out: UploadedImage = {
            url: dataUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          };

          setUploaded(out);
          setStatus("success");
          setError(hint);
          return out;
        }
        const first = (res ?? [])[0] as any;

        // UploadThing response shape can vary by version and router settings.
        // Common shapes:
        // - { url, key, ... }
        // - { ufsUrl, key, ... }
        // - { serverData: { url, key }, ... }
        // - { data: { url, key }, ... }
        const url: string | undefined =
          first?.url ??
          first?.ufsUrl ??
          first?.fileUrl ??
          first?.serverData?.url ??
          first?.data?.url;
        const key: string | undefined =
          first?.key ?? first?.serverData?.key ?? first?.data?.key;

        if (!url) {
          const topKeys = first && typeof first === "object" ? Object.keys(first) : [];
          const hint =
            topKeys.length > 0
              ? `Upload response keys: ${topKeys.join(", ")}`
              : "Upload response was empty.";
          throw new Error(
            `Upload succeeded but no URL was returned. ${hint} (Check UPLOADTHING_SECRET/UPLOADTHING_APP_ID and server logs.)`
          );
        }

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
