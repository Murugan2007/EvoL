import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { getProfile } from "@/lib/auth";
import { signOut } from "../actions";

export const metadata = { title: "More" };

const Row = ({ href, title, sub, dark }: { href: string; title: string; sub?: string; dark?: boolean }) => (
  <Link href={href} className={`card flex items-center justify-between ${dark ? "border-space bg-space text-white" : ""}`}>
    <span><span className="block font-semibold">{title}</span>{sub && <span className={`text-xs ${dark ? "text-white/60" : "text-muted"}`}>{sub}</span>}</span>
    <span aria-hidden>›</span>
  </Link>
);

export default async function MorePage() {
  const profile = await getProfile();
  return (
    <AppShell>
      <header className="px-5 pt-6"><Logo /></header>
      <section className="space-y-3 px-5 pt-6">
        {profile ? (
          <div className="card">
            <p className="font-semibold">{profile.full_name || "Evol learner"}</p>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
        ) : (
          <Row href="/login" title="Sign in" sub="Register, join classes, get your certificate" />
        )}

        {profile?.role === "admin" && <Row href="/admin" title="Admin menu" sub="Payments, batches, learners" dark />}

        <Row href="/about" title="About Evol" sub="Who we are and what we're building" />
        <Row href="/verify" title="Verify a certificate" sub="Check an Evol certificate ID" />

        {profile && (
          <form action={signOut}><button className="btn-ghost w-full">Sign out</button></form>
        )}
      </section>
    </AppShell>
  );
}
