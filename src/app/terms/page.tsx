import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Terms and refund policy" };

export default function Terms() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 pb-16 pt-6 leading-relaxed">
      <Link href="/more" className="text-sm text-muted">‹ Back</Link>
      <div><Logo /></div>
      <h1 className="text-2xl font-bold tracking-tight">Terms and refund policy</h1>
      <p className="text-sm text-muted">Last updated: November 2026. Evol is a student-run learning and maker initiative based in Chennai, India.</p>

      <h2 className="pt-2 text-lg font-bold">Courses and batches</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li>Seats are limited and confirmed only after we verify your payment. You will see your unique code in the app when you are approved.</li>
        <li>To receive the certificate of completion you must attend at least 50% of the classes and submit the course project, which we review.</li>
        <li>The certificate is issued by Evol. It is a certificate of completion and is not an accredited or university qualification.</li>
        <li>Rename yourself in the class to your code and first name so we can verify attendance. We may remove people who cannot be verified.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">Refunds</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li>Registration fees are non-refundable, as declared at registration.</li>
        <li>If Evol cancels a batch, you will be offered a seat in the next batch or a full refund.</li>
        <li>If you were charged twice for the same registration, contact us and we will refund the duplicate payment.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">Marketplace and requests</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
        <li>Makers are reviewed by Evol before they can sell. Products are reviewed before they appear.</li>
        <li>Makers are responsible for the items they list and for delivering what they describe.</li>
        <li>Requests you post are visible to approved makers. Do not include personal contact details in a request.</li>
        <li>Buyer-protection payments will launch with online checkout. Until then, do not pay a maker outside Evol.</li>
      </ul>

      <h2 className="pt-2 text-lg font-bold">Your conduct</h2>
      <p className="text-[15px]">Do not share class links, submit work that is not yours, upload fake payment proof, or misuse the platform. We may remove access and revoke certificates for misuse.</p>

      <h2 className="pt-2 text-lg font-bold">Contact</h2>
      <p className="text-[15px]">Message us on <a className="font-semibold text-evol" href="https://www.linkedin.com/company/evolindia" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</p>
    </main>
  );
}
