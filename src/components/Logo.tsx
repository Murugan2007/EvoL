import Image from "next/image";

/** Evol badge: the tight-cropped logo on its red square (hi-res source, crisp on 3x phones). */
export function Logo({ size = 36, word = false }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Evol"
        width={size * 3}
        height={size * 3}
        quality={90}
        className="object-cover"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.26) }}
        priority
      />
      {word && <span className="text-lg font-bold tracking-tight">Evol</span>}
    </span>
  );
}
