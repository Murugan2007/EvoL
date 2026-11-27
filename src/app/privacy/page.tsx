import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 pb-16 pt-6 leading-relaxed">
      <Link href="/more" className="text-sm text-muted">‹ Back</Link>
      <div><Logo /></div>
      <h1 className="text-2xl font-bold tracking-tight">Privacy policy</h1>
      <p className="text-sm text-muted">Last updated: November 2026. This explains what Evol collects and why, in line with India&apos;s Digital Personal Data Protection Act, 2023.</p>

      <h2 className="pt-2 text-lg font-bold">What we collect</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li><b>Account:</b> your email and name (from Google or the email you sign in with).</li>
        <li><b>Registration:</b> phone number, college, payment UTR, payer name and a payment screenshot, so we can verify your seat.</li>
        <li><b>Learning:</b> attendance, project links you submit, and certificates issued.</li>
        <li><b>Makers and requests:</b> maker applications, products you list, requests you post and offers you send.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">How we use it</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li>To verify payments, run classes, check attendance and issue certificates.</li>
        <li>To review makers and products and connect requests with makers.</li>
        <li>We do not sell your data and we do not show ads.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">Who can see it</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li>Payment screenshots are stored privately. Only you and Evol admins can open them.</li>
        <li>Anyone with a certificate ID can check it. The public check shows only your name, the course, the date and whether it is valid.</li>
        <li>Approved makers can read the requests you post. Product pages show a maker&apos;s display name only.</li>
        <li>We use Supabase (database and sign-in) and Vercel (hosting) to run the service.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">Your choices</h2>
      <p className="text-[15px]">You can ask us to correct or delete your data, or withdraw consent, by messaging us on <a className="font-semibold text-evol" href="https://www.linkedin.com/company/evolindia" target="_blank" rel="noopener noreferrer">LinkedIn</a>. Certificates already issued can be revoked rather than deleted so that verification stays reliable. We keep payment records as long as needed for accounting.</p>
    </main>
  );
}
