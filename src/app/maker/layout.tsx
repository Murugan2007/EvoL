import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireMaker } from "@/lib/auth";
import { MakerNav } from "./AdminLikeNav";

export const metadata = { title: "Maker studio", robots: { index: false, follow: false } };

export default async function MakerLayout({ children }: { children: React.ReactNode }) {
  await requireMaker();
  return (
    <div className="min-h-dvh bg-[#faf7f7]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Logo /><span className="chip bg-evol text-white">Maker</span></span>
            <Link href="/" className="text-sm font-semibold text-evol">‹ Back to app</Link>
          </div>
          <MakerNav />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
