import { BottomNav } from "./BottomNav";

/** Phone-style column with the soft pink top glow and the bottom bar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#fdeaea_0,#fff_320px)]">
      <div className="mx-auto min-h-dvh max-w-md pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
