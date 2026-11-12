"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const I = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items = [
  { href: "/", label: "Learn", icon: I("M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20") },
  { href: "/market", label: "Marketplace", icon: I("M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2") },
  { href: "/request", label: "Request", icon: I("M4 4h16v12H8l-4 4zM12 8v4M10 10h4") },
  { href: "/more", label: "More", icon: I("M5 12h.01M12 12h.01M19 12h.01") },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? "text-evol" : "text-muted"}`}
              >
                {it.icon}
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
