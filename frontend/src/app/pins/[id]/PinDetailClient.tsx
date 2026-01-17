"use client";

import { PinDetail } from "@/components/pinDetail/PinDetail";
import { usePins } from "@/components/pins/PinsStore";
import { getPinById as getSeedPinById, pins as seededPins } from "@/lib/sampleData";

export function PinDetailClient({ id }: { id: string }) {
  const { getPinById } = usePins();
  const pin = getPinById(id) ?? getSeedPinById(id) ?? seededPins[0];
  return <PinDetail pin={pin} />;
}

