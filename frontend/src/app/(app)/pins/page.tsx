import Link from "next/link";

export default function PinsIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-8 text-[var(--foreground)]">
          Recent
        </h1>
        <Link
          href="/"
          className="text-sm font-bold leading-5 text-[var(--primary)]"
        >
          Back
        </Link>
      </div>
      <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-[var(--muted-foreground)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        Pins list placeholder (grid + filters) goes here.
      </div>
    </div>
  );
}

