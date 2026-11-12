import Image from "next/image";

export function Logo({ size = 32, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Evol"
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        priority
      />
      {word && <span className="text-lg font-bold tracking-tight">Evol</span>}
    </span>
  );
}
