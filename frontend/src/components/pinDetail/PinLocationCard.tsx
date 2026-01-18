import Link from "next/link";

export function PinLocationCard({
  emoji,
  location,
}: {
  emoji: string;
  location: string;
}) {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <div className="w-8 text-2xl leading-8 text-[var(--foreground)]">
            {emoji}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm leading-5 text-[var(--muted-foreground)]">
              {location}
            </div>
            <Link
              href={directionsHref}
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

