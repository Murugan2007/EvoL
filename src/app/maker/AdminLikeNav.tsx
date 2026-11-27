"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/maker", label: "My products" },
  { href: "/maker/products/new", label: "Add product" },
  { href: "/maker/requests", label: "Requests" },
];

export function MakerNav() {
  const path = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {links.map((l) => (
        <Link key={l.href} href={l.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${path === l.href ? "bg-evol text-white" : "border border-line bg-white"}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
