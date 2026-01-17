export function PinNoteCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <p className="text-base leading-[26px] text-[var(--foreground)]">
        {text}
      </p>
      <div className="h-4" />
    </div>
  );
}

