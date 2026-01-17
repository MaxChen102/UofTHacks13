import { PinDetail } from "@/components/pinDetail/PinDetail";
import { getPinById, pins } from "@/lib/sampleData";

export default async function PinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pin = getPinById(id) ?? pins[0];

  return <PinDetail pin={pin} />;
}

