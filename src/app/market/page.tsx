import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Marketplace" };

export default function MarketPage() {
  return (
    <AppShell>
      <header className="px-5 pt-6"><Logo /></header>
      <section className="px-5 pt-8">
        <span className="chip bg-tint text-evol">Coming soon</span>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight">Cool things, made by students.</h1>
        <p className="mt-3 text-muted">Ready-made gadgets, keychains and projects from real makers — with buyer protection so you never worry about scams. Later: pre-owned components at fair prices.</p>
      </section>
    </AppShell>
  );
}
