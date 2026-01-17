"use client";

import * as React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

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
        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button
                type="button"
                className="h-10 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-bold text-[var(--foreground)]"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="h-10 rounded-full bg-black px-4 text-xs font-bold text-white"
              >
                Sign up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "size-10 rounded-full bg-[var(--surface-2)]",
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}

