import type { Pin } from "@/lib/sampleData";
import { PinDetailHeader } from "@/components/pinDetail/PinDetailHeader";
import { PinLinkCard } from "@/components/pinDetail/PinLinkCard";
import { PinLocationCard } from "@/components/pinDetail/PinLocationCard";
import { PinNoteCard } from "@/components/pinDetail/PinNoteCard";
import { PinSection } from "@/components/pinDetail/PinSection";
import { PinSourceCard } from "@/components/pinDetail/PinSourceCard";

export function PinDetail({ pin }: { pin: Pin }) {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <PinDetailHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-10 pt-4">
        <div className="flex items-start gap-3">
          <div className="text-4xl leading-10">{pin.emoji}</div>
          <h1 className="pt-1 text-2xl font-bold leading-[30px]">
            {pin.title}
          </h1>
        </div>

        <PinSection title="Links">
          <div className="flex flex-col gap-3">
            {pin.links.map((l) => (
              <PinLinkCard key={l.id} link={l} />
            ))}
          </div>
        </PinSection>

        <PinSection title="Notes">
          <PinNoteCard text={pin.notes} />
        </PinSection>

        <PinSection title="Locations">
          <PinLocationCard emoji={pin.emoji} location={pin.location} />
        </PinSection>

        <PinSection title="Source">
          <PinSourceCard imageUrl={pin.sourceImageUrl} alt={pin.title} />
        </PinSection>
      </main>
    </div>
  );
}

