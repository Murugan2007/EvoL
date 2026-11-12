import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Certificate check", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { p_cert_id: decodeURIComponent(id).slice(0, 40) });
  const cert = Array.isArray(data) ? data[0] : null;

  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <Logo size={40} />
      {cert && cert.valid ? (
        <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-6">
          <span className="chip bg-green-600 text-white">✓ Valid certificate</span>
          <p className="mt-4 text-sm text-muted">This certifies that</p>
          <p className="text-2xl font-bold">{cert.holder_name}</p>
          <p className="mt-3 text-sm text-muted">completed</p>
          <p className="font-semibold">{cert.course}</p>
          <p className="mt-3 text-sm text-muted">Issued on {new Date(cert.issued_on).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          <p className="mt-4 font-mono text-xs text-muted">{id.toUpperCase()}</p>
        </div>
      ) : cert ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
          <span className="chip bg-evol text-white">This certificate was revoked</span>
          <p className="mt-3 text-sm">It is no longer valid. Contact Evol if you think this is a mistake.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-line bg-tint p-6">
          <span className="chip bg-evol text-white">Not found</span>
          <p className="mt-3 text-sm">We couldn&apos;t find a certificate with this ID. Check for typos and try again.</p>
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Certificate of completion issued by Evol, a student-run learning initiative.</p>
      <Link href="/verify" className="mt-4 inline-block text-sm font-semibold text-evol">Check another ›</Link>
    </main>
  );
}
