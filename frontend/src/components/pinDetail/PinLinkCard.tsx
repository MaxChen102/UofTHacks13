import Link from "next/link";

interface PinLinkProps {
  link: {
    id: string;
    url: string;
    title: string;
  };
}

export function PinLinkCard({ link }: PinLinkProps) {
  return (
    <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex gap-3">
        <div className="w-8 text-2xl leading-8 text-[var(--foreground)]">
          🔗
        </div>
        <div className="flex flex-col">
          <div className="text-base font-bold leading-5 text-[var(--foreground)]">
            {link.title}
          </div>
          <Link
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-sm font-bold leading-5 text-[var(--primary)]"
          >
            ↗ Open Link
          </Link>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}

