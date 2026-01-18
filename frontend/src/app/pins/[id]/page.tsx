'use client';

import { PinDetail } from "@/components/pinDetail/PinDetail";
import { usePinPolling } from "@/hooks/usePinPolling";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { use } from "react";

export default function PinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { pin, isLoading, error, isProcessing, isFailed } = usePinPolling(id);

  if (isLoading || !pin) {
    return (
      <div className="min-h-dvh bg-[var(--background)] flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error || isFailed) {
    return (
      <div className="min-h-dvh bg-[var(--background)] flex items-center justify-center p-6">
        <div className="p-6 bg-red-50 text-red-800 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">
            {isFailed ? 'Processing Failed' : 'Failed to Load Pin'}
          </h2>
          <p className="text-sm">
            {isFailed
              ? 'There was an error processing this pin. Please try uploading again.'
              : 'Failed to load pin details. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-dvh bg-[var(--background)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <LoadingSpinner size={48} />
          <div>
            <h2 className="text-xl font-semibold mb-2">Processing your screenshot...</h2>
            <p className="text-sm text-muted-foreground">
              We're extracting information from your image. This usually takes a few seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <PinDetail pin={pin} />;
}
