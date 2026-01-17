import * as React from "react";
import CollectionsPageClient from "./CollectionsPageClient";

export default function CollectionsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-8 text-sm text-[var(--muted-foreground)]">
          Loading…
        </div>
      }
    >
      <CollectionsPageClient />
    </React.Suspense>
  );
}

