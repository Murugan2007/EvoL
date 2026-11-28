"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/batches", label: "Batches" },
  { href: "/admin/makers", label: "Makers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/learners", label: "Learners" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/submissions", label: "Projects" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/templates", label: "Cert design" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {links.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-space text-white" : "bg-white text-ink border border-line"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
