"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { useCollections } from "@/components/collections/CollectionsStore";
import { recentItems } from "@/lib/sampleData";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { collections, pinToCollectionId, setPinCollection, deleteCollection } =
    useCollections();

  const list =
    id === "all"
      ? { id: "all", name: "All Saves" }
      : collections.find((c) => c.id === id);

  if (!list) {
    return (
      <div className="min-h-dvh bg-[var(--background)] px-4 py-8">
        <Link href="/collections" className="text-sm font-bold text-[var(--primary)]">
          Back to Lists
        </Link>
        <div className="mt-4 text-base text-[var(--muted-foreground)]">
          List not found.
        </div>
      </div>
    );
  }

  const options = [
    { id: "", name: "None" },
    ...collections.map((c) => ({ id: c.id, name: c.name })),
  ];

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
          <div className="text-base font-bold leading-6">{list.name}</div>
          {list.id !== "all" ? (
            <button
              type="button"
              className="text-sm font-bold leading-5 text-[var(--primary)]"
              onClick={() => {
                deleteCollection(list.id);
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
          Assign each restaurant to a list. Default is <b>None</b>.
        </div>

        {recentItems.map((p) => {
          const current = pinToCollectionId[p.id] ?? "";
          const show =
            list.id === "all" ? true : (pinToCollectionId[p.id] ?? null) === list.id;

          if (!show) return null;

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            >
              <div className="relative size-14 overflow-hidden rounded-xl bg-[var(--surface-2)]">
                <Image
                  alt=""
                  src={p.imageUrl}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="truncate text-sm font-bold leading-5">
                  {p.emoji} {p.title}
                </div>
                <div className="text-xs leading-4 text-[var(--muted-foreground)]">
                  {p.timeAgo}
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

