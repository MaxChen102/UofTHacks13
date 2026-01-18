"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeftIcon } from "@/components/icons";
import { useCollections } from "@/hooks/useCollections";
import { usePins } from "@/hooks/usePins";
import { createClientPinsApi } from "@/lib/api/pins";
import type { Pin } from "@/lib/types/pin";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { getToken } = useAuth();
  const router = useRouter();
  const { collections, isLoading, error, deleteCollection } = useCollections();
  const { pins, refetch } = usePins();

  const collection =
    id === "all"
      ? { id: "all", name: "All Collections" }
      : collections.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[var(--background)] px-4 py-8 text-sm text-[var(--muted-foreground)]">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-[var(--background)] px-4 py-8 text-sm text-red-600">
        {error.message || "Failed to load collections."}
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-dvh bg-[var(--background)] px-4 py-8">
        <Link href="/collections" className="text-sm font-bold text-[var(--primary)]">
          Back to Collections
        </Link>
        <div className="mt-4 text-base text-[var(--muted-foreground)]">
          Collection not found.
        </div>
      </div>
    );
  }

  const options = [
    { id: "", name: "None" },
    ...collections.map((c) => ({ id: c.id, name: c.name })),
  ];

  async function setPinCollection(pinId: string, collectionId: string | null) {
    const token = await getToken();
    if (!token) {
      throw new Error("No authentication token available");
    }
    const api = createClientPinsApi(token);
    await api.update(pinId, { collection_id: collectionId || undefined });
    refetch();
  }

  const filteredPins =
    collection.id === "all" ? pins : pins.filter((pin) => pin.collection_id === collection.id);

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 bg-[var(--background)]">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
          <Link
            href="/collections"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="Back"
          >
            <ArrowLeftIcon />
          </Link>
          <div className="text-base font-bold leading-6">{collection.name}</div>
          {collection.id !== "all" ? (
            <button
              type="button"
              className="text-sm font-bold leading-5 text-[var(--primary)]"
              onClick={async () => {
                try {
                  await deleteCollection(collection.id);
                  refetch();
                  router.push("/collections");
                } catch (err) {
                  console.error("Failed to delete collection:", err);
                }
              }}
            >
              Delete
            </button>
          ) : (
            <div className="w-14" />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-10 pt-4">
        <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-[var(--muted-foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          Assign each pin to a collection. Default is <b>None</b>.
        </div>

        {filteredPins.map((p) => {
          const current = p.collection_id ?? "";

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            >
              <div className="relative size-14 overflow-hidden rounded-xl bg-[var(--surface-2)]">
                {p.source_images?.[0] ? (
                  <Image
                    alt=""
                    src={p.source_images[0]}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="truncate text-sm font-bold leading-5">
                  {pinEmoji(p)} {p.title}
                </div>
                <div className="text-xs leading-4 text-[var(--muted-foreground)]">
                  {formatTimeAgo(p.created_at)}
                </div>
              </div>
              <select
                value={current}
                onChange={(e) =>
                  setPinCollection(p.id, e.target.value || null)
                }
                className="h-10 rounded-xl border border-[var(--border)] bg-white px-2 text-sm"
                aria-label="Assign to list"
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </main>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function pinEmoji(pin: Pin): string {
  switch (pin.pin_type) {
    case "restaurant":
      return "🍽️";
    case "concert":
      return "🎵";
    case "sports":
      return "⚽";
    default:
      return "📍";
  }
}

