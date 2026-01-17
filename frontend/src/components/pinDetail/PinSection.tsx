import type { PropsWithChildren } from "react";

export function PinSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="flex flex-col gap-3">
      <div className="text-sm font-bold leading-5 text-[var(--muted-foreground)]">
        {title}
      </div>
      {children}
    </section>
  );
}

