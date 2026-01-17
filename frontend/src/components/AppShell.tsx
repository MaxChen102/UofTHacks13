import type { PropsWithChildren } from "react";
import { Fab } from "@/components/Fab";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
        {children}
      </main>
      <Fab />
    </div>
  );
}

