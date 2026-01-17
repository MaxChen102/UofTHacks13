"use client";

import Link from "next/link";
import { PlusIcon } from "@/components/icons";

export function Fab() {
  return (
    <Link
      href="/upload"
      className="fixed bottom-6 right-6 z-30 inline-flex size-14 items-center justify-center rounded-full bg-black text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
      aria-label="Upload new pin"
    >
      <PlusIcon className="text-white" />
    </Link>
  );
}

