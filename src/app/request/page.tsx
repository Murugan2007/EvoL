import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Request" };

export default function RequestPage() {
  return (
    <AppShell>
      <header className="px-5 pt-6"><Logo /></header>
      <section className="px-5 pt-8">
        <span className="chip bg-tint text-evol">Coming soon</span>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight">Got a crazy idea? Or something that needs fixing?</h1>
        <p className="mt-3 text-muted">Post what you need, set a budget, and makers will tell you how they&apos;d do it. We&apos;re opening this after the first learning batch.</p>
      </section>
    </AppShell>
  );
}
