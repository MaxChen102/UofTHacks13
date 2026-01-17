"use client";

import Link from "next/link";
import { ArrowLeftIcon, BookmarkIcon, DotsIcon, LinkIcon } from "../icons";

export function PinDetailHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[var(--background)]">
      <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
        <Link
          href="/"
          className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--muted-foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="Save"
          >
            <BookmarkIcon />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--muted-foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="Copy link"
          >
            <LinkIcon />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--muted-foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            aria-label="More"
          >
            <DotsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

