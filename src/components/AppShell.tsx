import { BottomNav } from "./BottomNav";

/** Phone-style column with the bottom bar. Used by Learn / Marketplace / Request / More. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
