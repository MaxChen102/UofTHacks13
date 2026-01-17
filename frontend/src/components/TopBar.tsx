"use client";

import * as React from "react";
import { UserIcon } from "@/components/icons";

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function TopBar() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[var(--background)]">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <div className="text-xs leading-4 text-[var(--muted-foreground)]">
          {formatTime(now)}
        </div>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-foreground)]"
          aria-label="Account"
        >
          <UserIcon />
        </button>
      </div>
    </header>
  );
}

