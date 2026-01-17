import { PinDetailClient } from "@/app/pins/[id]/PinDetailClient";

export default async function PinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PinDetailClient id={id} />;
}

