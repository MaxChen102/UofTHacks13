 "use client";

import { StarRatingDisplay, StarRatingInput } from "@/components/ratings/StarRating";
import { useUserRating } from "@/components/ratings/UserRatingsStore";

export function PinAiSummaryCard({
  ratingKey,
  aiSuggestedRating,
  description,
}: {
  ratingKey: string;
  aiSuggestedRating: number;
  description: string;
}) {
  const [userRating, setUserRating] = useUserRating(ratingKey);

  return (
    <div className="rounded-2xl bg-white px-4 pt-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRatingDisplay rating={aiSuggestedRating} className="text-amber-500" />
          <div className="text-sm font-bold leading-5 text-foreground">
            {aiSuggestedRating.toFixed(1)}
          </div>
        </div>
        <div className="text-xs leading-4 text-muted-foreground">
          AI suggested
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-foreground">{description}</p>

      <div className="my-4 h-px w-full bg-[var(--border)]" />

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold leading-5 text-foreground">
          Your rating
        </div>
        <StarRatingInput
          value={userRating}
          onChange={setUserRating}
          label="Your rating"
        />
      </div>
      <div className="h-4" />
    </div>
  );
}

