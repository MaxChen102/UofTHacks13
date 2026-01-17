import Image from "next/image";

export function PinSourceCard({
  imageUrl,
  alt = "",
}: {
  imageUrl: string;
  alt?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="relative h-[460px] w-full sm:h-[760px]">
        <Image
          alt={alt}
          src={imageUrl}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
          priority
        />
      </div>
    </div>
  );
}

