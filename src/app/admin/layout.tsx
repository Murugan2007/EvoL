import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="min-h-dvh bg-[#faf7f7]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Logo /><span className="chip bg-space text-white">Admin</span></span>
            <span className="flex items-center gap-4 text-sm">
              <span className="hidden text-muted sm:inline">{me.email}</span>
              <Link href="/" className="font-semibold text-evol">‹ Back to app</Link>
            </span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
