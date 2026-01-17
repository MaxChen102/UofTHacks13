"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-8">
      <SignIn />
    </div>
  );
}
