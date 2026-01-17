
"use client";

import * as React from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useRouter } from "next/navigation";
import { PinAiSummaryCard } from "@/components/pinDetail/PinAiSummaryCard";
import { usePins } from "@/components/pins/PinsStore";
import type { Pin } from "@/lib/sampleData";

export default function UploadPage() {
  const router = useRouter();
  const { createPin } = usePins();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [placeName, setPlaceName] = React.useState("");
  const [placeError, setPlaceError] = React.useState<string | null>(null);
  const [isCreatingPin, setIsCreatingPin] = React.useState(false);

  const { upload, reset, status, error, uploaded, isUploading } =
    useImageUpload();

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
    reset();
    setFile(next);
  }

  async function onSubmit() {
    if (!file || isUploading || isCreatingPin) return;
    const q = placeName.trim();
    if (!q) {
      setPlaceError("Please enter the place name (e.g. Nobu).");
      return;
    }

    setPlaceError(null);
    setIsCreatingPin(true);
    try {
      const uploadedImage = await upload(file);

      const placeRes = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const placeJson = await placeRes.json().catch(() => ({}));
      if (!placeRes.ok) {
        throw new Error(placeJson?.message || placeJson?.error || "Place lookup failed");
      }

      const id = `pin-${Date.now().toString(36)}`;

      const pin: Pin = {
        id,
        title: placeJson?.name ?? q,
        emoji: "📍",
        aiSuggestedRating:
          typeof placeJson?.rating === "number" ? placeJson.rating : 4.2,
        aiDescription:
          "Fetched from Google Places based on the name you entered. Add your own notes and rating below.",
        links: [],
        notes: "",
        location: {
          name: placeJson?.name ?? q,
          description: "",
          address: placeJson?.formattedAddress ?? "",
          directionsHref:
            placeJson?.googleMapsUrl ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              placeJson?.formattedAddress || placeJson?.name || q
            )}`,
          placeId: placeJson?.placeId,
          lat: placeJson?.lat,
          lng: placeJson?.lng,
          googleRating: placeJson?.rating,
          userRatingsTotal: placeJson?.userRatingsTotal,
          website: placeJson?.website,
          phoneNumber: placeJson?.phoneNumber,
          googleMapsUrl: placeJson?.googleMapsUrl,
        },
        sourceImageUrl: uploadedImage.url,
      };

      createPin(pin);
      router.push(`/pins/${id}`);
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsCreatingPin(false);
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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold leading-5 text-muted-foreground">
          Place name
        </label>
        <input
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="e.g. Nobu"
          className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
        />
        {placeError ? (
          <div className="text-sm text-red-600">{placeError}</div>
        ) : null}
        <div className="text-xs leading-4 text-muted-foreground">
          We’ll fetch the address and place details using Google Places.
        </div>
      </div>

      {previewUrl ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold leading-5 text-muted-foreground">
            AI Summary
          </div>
          <PinAiSummaryCard
            ratingKey="upload:preview"
            aiSuggestedRating={4.4}
            description="Based on the screenshot, this looks like a great spot. Enter the place name above (e.g. Nobu) and submit to fetch real details."
          />
        </div>
      ) : null}

      <button
        type="button"
        className="h-12 rounded-full bg-black px-5 text-sm font-bold leading-5 text-white disabled:opacity-50"
        disabled={!file || isUploading || isCreatingPin}
        onClick={onSubmit}
      >
        {isCreatingPin ? "Creating pin…" : isUploading ? "Uploading…" : "Submit"}
      </button>
    </div>
  );
}

