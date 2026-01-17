import Link from "next/link";
import type { PinLocation } from "@/lib/sampleData";

export function PinLocationCard({
  emoji,
  location,
}: {
  emoji: string;
  location: PinLocation;
}) {
  const mapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const embedSrc =
    location.mapEmbedSrc ||
    (mapsEmbedKey && location.placeId
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
          mapsEmbedKey
        )}&q=place_id:${encodeURIComponent(location.placeId)}`
      : undefined);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        {embedSrc ? (
          <iframe
            title="Map"
            src={embedSrc}
            className="h-48 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-white text-sm text-[var(--muted-foreground)]">
            Map preview unavailable (set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable).
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <div className="w-8 text-2xl leading-8 text-[var(--foreground)]">
            {emoji}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-bold leading-6 text-[var(--foreground)]">
              {location.name}
            </div>
            <div className="text-sm leading-[22.75px] text-[var(--muted-foreground)]">
              {location.description}
            </div>
            <div className="text-sm leading-5 text-[var(--muted-foreground)]">
              {location.address}
            </div>
            <Link
              href={location.directionsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-sm font-bold leading-5 text-[var(--primary)]"
            >
              ↗ Get Directions
            </Link>
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

