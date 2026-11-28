import Link from "next/link";
import { Logo } from "@/components/Logo";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evolindia.vercel.app";
const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function Contact() {
  return (
    <p>
      {email ? (<>Email us at <a className="font-semibold text-evol" href={`mailto:${email}`}>{email}</a> or message </>) : <>Message </>}
      <a className="font-semibold text-evol" href="https://www.linkedin.com/company/evolindia" target="_blank" rel="noopener noreferrer">Evol on LinkedIn</a>.
      We reply within 7 days, and within 30 days at the latest for requests about your data.
    </p>
  );
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-6 text-[15px] leading-relaxed">
      <div className="flex items-center justify-between">
        <Link href="/about" className="inline-flex items-center gap-2"><Logo size={32} word /></Link>
        <nav className="flex gap-4 text-sm font-semibold text-evol"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      </div>
      <h1 className="mt-8 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated: {updated}</p>
      <div className="legal mt-6 space-y-4 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:pt-1 [&_h3]:font-bold [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      <footer className="mt-12 border-t border-line pt-4 text-xs text-muted">Evol is a student-run learning and maker initiative operated by Murugan U, Chennai, India. © {new Date().getFullYear()} Evol.</footer>
    </main>
  );
}
