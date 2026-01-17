"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-8">
      <SignUp />
    </div>
  );
}
