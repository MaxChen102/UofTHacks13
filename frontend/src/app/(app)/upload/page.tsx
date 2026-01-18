
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useCreatePin } from "@/hooks/useCreatePin";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const { upload, reset: resetUpload, status, error: uploadError, uploaded, isUploading } =
    useImageUpload();
  const { createPin, isCreating, error: createError } = useCreatePin();

  const error = uploadError || (createError?.message ?? null);
  const isProcessing = isUploading || isCreating;

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function onPickFile(next: File | null) {
    resetUpload();
    setFile(next);
  }

  async function onSubmit() {
    if (!file || isProcessing) return;

    try {
      const uploadedImage = await upload(file);

      const pin = await createPin({ image_url: uploadedImage.url });
      if (pin) {
        router.push(`/pins/${pin.id}`);
      }
    } catch (err) {
      console.error('Failed to create pin:', err);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold leading-8 text-foreground">
        Upload Screenshot
      </h1>

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFilePicker();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const dropped = e.dataTransfer?.files?.[0] ?? null;
          onPickFile(dropped);
        }}
        className={[
          "rounded-2xl border-2 border-dashed bg-white p-6 text-sm leading-6",
          isDragging ? "border-[var(--primary)]" : "border-[var(--border)]",
          previewUrl ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />

        {previewUrl ? (
          <div className="flex flex-col gap-3">
            <img
              src={previewUrl}
              alt="Selected screenshot preview"
              className="w-full rounded-xl border border-[var(--border)] object-cover"
            />
            <div className="text-xs leading-5 text-[var(--muted-foreground)]">
              {file?.name} •{" "}
              {file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : ""}
            </div>
            <button
              type="button"
              className="w-fit text-sm font-bold leading-5 text-[var(--primary)]"
              onClick={(e) => {
                e.stopPropagation();
                onPickFile(null);
              }}
            >
              Choose a different file
            </button>
          </div>
        ) : (
          "Drag & drop a screenshot here, or click to choose a file."
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {uploaded ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-6">
          <div className="font-bold text-[var(--foreground)]">Uploaded</div>
          <a
            href={uploaded.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-[var(--primary)] underline"
          >
            {uploaded.url}
          </a>
        </div>
      ) : null}

      <button
        type="button"
        className="h-12 rounded-full bg-black px-5 text-sm font-bold leading-5 text-white disabled:opacity-50"
        disabled={!file || isProcessing}
        onClick={onSubmit}
      >
        {isUploading
          ? "Uploading…"
          : isCreating
            ? "Creating Pin…"
            : status === "success"
              ? "Uploaded"
              : "Submit"}
      </button>
    </div>
  );
}

