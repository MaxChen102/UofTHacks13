import type { Pin } from "@/lib/types/pin";
import { PinDetailHeader } from "@/components/pinDetail/PinDetailHeader";
import { PinAiSummaryCard } from "@/components/pinDetail/PinAiSummaryCard";
import { PinLinkCard } from "@/components/pinDetail/PinLinkCard";
import { PinLocationCard } from "@/components/pinDetail/PinLocationCard";
import { PinNoteCard } from "@/components/pinDetail/PinNoteCard";
import { PinSection } from "@/components/pinDetail/PinSection";
import { PinSourceCard } from "@/components/pinDetail/PinSourceCard";

function getPinEmoji(pinType: string): string {
  switch (pinType) {
    case 'restaurant':
      return '🍽️';
    case 'concert':
      return '🎵';
    case 'sports':
      return '⚽';
    default:
      return '📍';
  }
}

export function PinDetail({ pin }: { readonly pin: Pin }) {
  const emoji = getPinEmoji(pin.pin_type);

  const linkItems = pin.links
    ? Object.entries(pin.links)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([key, url]) => ({
          id: key,
          url,
          title: key.charAt(0).toUpperCase() + key.slice(1),
        }))
    : [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PinDetailHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-10 pt-4">
        <div className="flex items-start gap-3">
          <div className="text-4xl leading-10">{emoji}</div>
          <h1 className="pt-1 text-2xl font-bold leading-[30px]">
            {pin.title}
          </h1>
        </div>

        {linkItems.length > 0 && (
          <PinSection title="Links">
            <div className="flex flex-col gap-3">
              {linkItems.map((l) => (
                <PinLinkCard key={l.id} link={l} />
              ))}
            </div>
          </PinSection>
        )}

        <PinSection title="Summary">
          <PinNoteCard text={pin.summary} />
        </PinSection>

        {pin.ai_recommendation ? (
          <PinSection title="AI Recommendation">
            <PinAiSummaryCard
              ratingKey={`pin:${pin.id}`}
              aiSuggestedRating={5}
              description={pin.ai_recommendation}
            />
          </PinSection>
        ) : null}

        {pin.location && (
          <PinSection title="Location">
            <PinLocationCard emoji={emoji} location={pin.location} />
          </PinSection>
        )}

        <PinSection title="Source">
          <PinSourceCard imageUrl={pin.source_images[0]} alt={pin.title} />
        </PinSection>
      </main>
    </div>
  );
}

