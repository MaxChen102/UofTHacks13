"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PlusIcon } from "@/components/icons";
import { useCollections } from "@/hooks/useCollections";
import { usePins } from "@/hooks/usePins";

export default function CollectionsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collections, isLoading, error, createCollection } = useCollections();
  const { pins } = usePins();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    if (searchParams.get("create") === "1") setCreateOpen(true);
  }, [searchParams]);

  const allSavesCount = pins.length;

  async function onCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await createCollection({ name: trimmed });
      setName("");
      setCreateOpen(false);
      router.push(`/collections/${created.id}`);
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 bg-[var(--background)]">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
          <Link
            href="/"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="Back"
          >
            <ArrowLeftIcon />
          </Link>

          <div className="text-xl font-bold leading-7">Collections</div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="Create list"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-10 pt-16">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error.message || "Failed to load collections."}
          </div>
        ) : null}
        <Link
          href="/collections/all"
          className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
        >
          <div className="flex h-[46px] items-center justify-between">
            <div className="flex flex-col gap-0.5">
            <div className="text-base font-bold leading-6">All Collections</div>
              <div className="text-sm leading-5 text-[var(--muted-foreground)]">
                📌 {allSavesCount} saves
              </div>
            </div>
            <div className="text-base leading-6 text-[var(--muted-foreground)]">
              ›
            </div>
          </div>
          <div className="h-4" />
        </Link>

        {collections.map((c) => {
          const n = pins.filter((p) => p.collection_id === c.id).length;
          return (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            >
              <div className="flex h-[46px] items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="text-base font-bold leading-6">{c.name}</div>
                  <div className="text-sm leading-5 text-[var(--muted-foreground)]">
                    📌 {n} {n === 1 ? "save" : "saves"}
                  </div>
                </div>
                <div className="text-base leading-6 text-[var(--muted-foreground)]">
                  ›
                </div>
              </div>
              <div className="h-4" />
            </Link>
          );
        })}

        <button
          type="button"
          className="mt-2 flex h-[68px] items-center justify-center gap-2 rounded-2xl border-2 border-[var(--border)] bg-transparent text-[var(--muted-foreground)]"
          onClick={() => setCreateOpen(true)}
          disabled={isLoading}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-[var(--muted-foreground)] text-lg leading-[18px]">
            +
          </span>
          <span className="text-base font-bold leading-6">Create New Collection</span>
        </button>
      </main>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
            <div className="text-base font-bold leading-6">Create new collection</div>
            <div className="mt-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                autoFocus
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="h-11 flex-1 rounded-xl border border-[var(--border)] text-sm font-bold"
                onClick={() => {
                  setCreateOpen(false);
                  setName("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-xl bg-black text-sm font-bold text-white disabled:opacity-50"
                onClick={onCreate}
                disabled={!name.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

