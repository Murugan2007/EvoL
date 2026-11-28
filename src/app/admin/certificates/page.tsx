import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { issueAllEligible, issueCertificate, renameCertificate, revokeCertificate } from "../actions";

export default async function CertificatesAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("batches").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const [{ data: regs }, { data: classes }, { data: att }, { data: subs }, { data: certs }] = await Promise.all([
    supabase.from("registrations").select("id,user_id,code,full_name").eq("status", "approved").eq("batch_id", batch?.id ?? ""),
    supabase.from("classes").select("id").eq("batch_id", batch?.id ?? ""),
    supabase.from("attendance").select("registration_id,attended"),
    supabase.from("submissions").select("registration_id,status"),
    supabase.from("certificates").select("*").order("issued_at", { ascending: false }),
  ]);
  const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", (regs ?? []).map((r) => r.user_id));
  const profName = new Map((profs ?? []).map((p) => [p.id, p.full_name?.trim()]));
  const printName = (r: { user_id: string; full_name: string }) => profName.get(r.user_id) || r.full_name;
  const { count: tplCount } = await supabase.from("certificate_templates").select("*", { count: "exact", head: true }).eq("is_active", true);
  const total = classes?.length ?? 0;
  const present = new Map<string, number>();
  (att ?? []).filter((a) => a.attended).forEach((a) => present.set(a.registration_id, (present.get(a.registration_id) ?? 0) + 1));
  const accepted = new Set((subs ?? []).filter((s) => s.status === "accepted").map((s) => s.registration_id));
  const issued = new Set((certs ?? []).map((c) => c.registration_id));
  const name = new Map((regs ?? []).map((r) => [r.id, r]));

  const rows = (regs ?? []).filter((r) => !issued.has(r.id)).map((r) => {
    const p = present.get(r.id) ?? 0;
    const okAtt = total > 0 && p * 2 >= total;
    const okProj = accepted.has(r.id);
    return { ...r, p, okAtt, okProj, eligible: okAtt && okProj };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible));

  const Tick = ({ ok, label }: { ok: boolean; label: string }) => <span className={`chip ${ok ? "bg-green-100 text-green-800" : "bg-line text-muted"}`}>{ok ? "✓" : "✗"} {label}</span>;

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{error}</p>}
      {!tplCount && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No certificate design uploaded yet, so the built-in Evol design is used. <Link href="/admin/templates" className="font-semibold underline">Upload yours</Link>.</p>}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">To issue ({rows.filter((r) => r.eligible).length} eligible)</h2>
          {rows.some((r) => r.eligible) && batch && (
            <form action={issueAllEligible}><input type="hidden" name="batch_id" value={batch.id} /><button className="btn btn-sm">Issue to all {rows.filter((r) => r.eligible).length} eligible</button></form>
          )}
        </div>
        {rows.length === 0 && <p className="card text-sm text-muted">Everyone approved already has a certificate, or no one is approved yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{printName(r)} <span className="font-mono text-sm text-evol">{r.code}</span></p>
              <p className="text-xs text-muted">Prints as “{printName(r)}” (the learner’s profile name)</p>
              <div className="mt-1 flex gap-2"><Tick ok={r.okAtt} label={`Attendance ${r.p}/${total}`} /><Tick ok={r.okProj} label="Project accepted" /></div></div>
            <form action={issueCertificate}><input type="hidden" name="id" value={r.id} /><button className="btn btn-sm" disabled={!r.eligible}>Issue certificate</button></form>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Issued ({certs?.length ?? 0})</h2>
        {(certs ?? []).map((c) => (
          <div key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{c.holder_name ?? name.get(c.registration_id)?.full_name ?? "Learner"} <span className={`chip ml-1 ${c.revoked ? "bg-red-100 text-evol" : "bg-green-100 text-green-800"}`}>{c.revoked ? "Revoked" : "Valid"}</span></p>
              <p className="mt-0.5 font-mono text-sm">{c.cert_id}</p>
              <Link href={`/certificate/${c.cert_id}`} className="text-sm font-semibold text-evol">Open certificate ›</Link>
            </div>
            {!c.revoked && (
              <form action={renameCertificate} className="flex gap-2"><input type="hidden" name="cert_id" value={c.cert_id} />
                <input name="name" className="input py-2 text-sm" placeholder="Fix printed name" minLength={2} maxLength={60} required /><button className="btn-ghost btn-sm">Rename</button></form>
            )}
            {!c.revoked && (
              <form action={revokeCertificate} className="flex gap-2"><input type="hidden" name="cert_id" value={c.cert_id} />
                <input name="reason" className="input py-2 text-sm" placeholder="Reason" /><button className="btn-ghost btn-sm text-evol">Revoke</button></form>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
