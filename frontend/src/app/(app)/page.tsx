'use client';

import Image from "next/image";
import Link from "next/link";
import { lists } from "@/lib/sampleData";
import { usePins } from "@/hooks/usePins";
import { PinCardSkeleton } from "@/components/shared/LoadingSpinner";

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return `${diffDays}d`;
  }
}

function getPinEmoji(pinType: string): string {
  switch (pinType) {
    case 'restaurant':
      return '🍽️';
    case 'concert':
      return '🎵';
    case 'sports':
      return '⚽';
    default:
      return '📍';
  }
}

export default function Home() {
  const { pins, isLoading, error } = usePins();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold leading-8 text-foreground font-alice">
            Recent
          </h2>
          <Link
            href="/pins"
            className="text-sm font-bold leading-5 text-primary"
          >
            See All
          </Link>
        </div>

        {isLoading ? (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-40 shrink-0">
                <PinCardSkeleton />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-800 rounded-lg">
            <p className="text-sm">Failed to load pins. Please try again.</p>
          </div>
        ) : pins.length === 0 ? (
          <div className="p-6 bg-gray-50 text-gray-600 rounded-lg text-center">
            <p className="text-sm">No pins yet. Upload a screenshot to get started!</p>
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {pins.map((pin) => {
              const isProcessing = pin.processing_status === 'processing' || pin.processing_status === 'pending';

              return (
                <Link
                  key={pin.id}
                  href={`/pins/${pin.id}`}
                  className="w-40 shrink-0"
                >
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="relative h-[213px] w-40 overflow-hidden rounded-2xl bg-white">
                      <Image
                        alt={pin.title}
                        src={pin.source_images[0]}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                            Processing...
                          </div>
                        </div>
                      )}
                      <div className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                        <span className="text-[18px] leading-7">
                          {getPinEmoji(pin.pin_type)}
                        </span>
                      </div>
                      <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-center text-xs leading-4 text-white">
                        {getTimeAgo(pin.created_at)}
                      </div>
                    </div>
                    <div className="text-sm font-bold leading-[17.5px] text-foreground">
                      {pin.title}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold leading-8 text-foreground font-alice">
            Collections
          </h2>
          <Link
            href="/collections?create=1"
            className="text-sm font-bold leading-5 text-primary"
          >
            Create New
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href="/collections"
              className="flex h-14 items-center justify-between rounded-2xl bg-white px-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            >
              <div className="text-base font-bold leading-6 text-foreground">
                {list.name}
              </div>
              <div className="flex items-center gap-2 text-sm leading-5 text-muted-foreground">
                <span>{list.savesLabel}</span>
                <span className="text-base leading-6">›</span>
              </div>
            </Link>
          ))}

          <Link
            href="/collections?create=1"
            className="flex h-[68px] items-center justify-center gap-2 rounded-2xl border-2 border-border bg-transparent text-muted-foreground"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground text-lg leading-[18px]">
              +
            </span>
            <span className="text-base font-bold leading-6">
              Create New List
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

