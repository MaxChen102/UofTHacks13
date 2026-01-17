"use client";

import * as React from "react";
import Image from "next/image";
import { PinAiSummaryCard } from "@/components/pinDetail/PinAiSummaryCard";

export default function UploadPage() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold leading-8 text-foreground">
        Upload Screenshot
      </h1>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        className="overflow-hidden rounded-2xl border-2 border-dashed border-border bg-white p-0 text-left"
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              alt="Selected screenshot"
              src={previewUrl}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
          </div>
        ) : (
          <div className="p-6 text-sm leading-6 text-muted-foreground">
            Click to choose an image (or drag & drop here).
          </div>
        )}
      </button>

      {previewUrl ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold leading-5 text-muted-foreground">
            AI Summary
          </div>
          <PinAiSummaryCard
            ratingKey="upload:preview"
            aiSuggestedRating={4.4}
            description="Based on the screenshot, this looks like a great special-occasion spot with a strong reputation. Expect higher prices and limited availability, so booking ahead is recommended."
          />
        </div>
      ) : null}

      <button
        type="button"
        className="h-12 rounded-full bg-black px-5 text-sm font-bold leading-5 text-white disabled:opacity-50"
        disabled={!file}
      >
        Submit
      </button>
    </div>
  );
}

