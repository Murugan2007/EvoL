"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items = [
  { href: "/", label: "Learn", d: "M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.500.5 8 2 1.500-1.500 4-2 8-2v-13c-4 0-6.500.5-8 2zM12 6.500v13" },
  { href: "/market", label: "Marketplace", d: "M5.500 8h13l-1 12h-11zM9 8V6.500a3 3 0 0 1 6 0V8" },
  { href: "/request", label: "Request", d: "M4 5h16v11H9l-5 4zM12 8v5M9.500 10.500h5" },
  { href: "/more", label: "More", d: "M4.500 4.500h6v6h-6zM13.500 4.500h6v6h-6zM4.500 13.500h6v6h-6zM13.500 13.500h6v6h-6z" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md px-2">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link href={it.href} prefetch className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "font-bold text-evol" : "font-medium text-muted"}`}>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-[#fde3e3]" : ""}`}>
                  <Ico d={it.d} />
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
