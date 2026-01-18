import Link from "next/link";
import type { Location } from "@/lib/types/pin";

export function PinLocationCard({
  emoji,
  location,
}: {
  emoji: string;
  location: Location;
}) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const embedSrc = mapsApiKey
    ? buildEmbedSrc(mapsApiKey, location)
    : undefined;

  const hasCoords = typeof location.lat === "number" && typeof location.lng === "number";
  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    : location.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      {embedSrc && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <iframe
            title="Map"
            src={embedSrc}
            className="h-48 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <div className="w-8 text-2xl leading-8 text-foreground">
            {emoji}
          </div>
          <div className="flex flex-col gap-1">
            {location.address && (
              <div className="text-sm leading-5 text-muted-foreground">
                {location.address}
              </div>
            )}
            {directionsHref && (
              <Link
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-sm font-bold leading-5 text-primary"
              >
                ↗ Get Directions
              </Link>
            )}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// TODO: Use Google Places API to get real place_ids from lat/lng coordinates
// For now, we skip place_id and use lat/lng directly to avoid invalid place_id errors
// Future: Re-enable place_id usage once we integrate Google Places API
// function isGooglePlaceId(value?: string | null): value is string {
//   if (!value) return false;
//   return value.startsWith("ChI");
// }

function buildEmbedSrc(apiKey: string, location: Location): string | undefined {
  // TODO: Re-enable place_id usage once we integrate Google Places API
  // to fetch real place_ids from coordinates
  // if (isGooglePlaceId(location.place_id)) {
  //   return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=place_id:${encodeURIComponent(location.place_id)}`;
  // }

  // Use lat/lng coordinates directly (most reliable)
  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${location.lat},${location.lng}`;
  }

  // Fallback to address if coordinates not available
  if (location.address) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(location.address)}`;
  }

  return undefined;
}