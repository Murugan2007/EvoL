import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approveRegistration, rejectRegistration } from "../actions";

type Status = "pending" | "approved" | "rejected";
const tabs: Status[] = ["pending", "approved", "rejected"];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const sp = await searchParams;
  const status: Status = tabs.includes(sp.status as Status) ? (sp.status as Status) : "pending";
  const supabase = await createClient();

  const [{ data: rows }, { data: all }] = await Promise.all([
    supabase.from("registrations").select("*").eq("status", status).order("created_at", { ascending: status !== "approved" ? true : false }),
    supabase.from("registrations").select("utr,status"),
  ]);

  // Duplicate-UTR flag: same UTR used on more than one request.
  const utrCount = new Map<string, number>();
  (all ?? []).forEach((r) => utrCount.set(r.utr, (utrCount.get(r.utr) ?? 0) + 1));

  // Short-lived private links to the screenshots (admin-only via storage policy).
  const paths = (rows ?? []).map((r) => r.screenshot_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("payment-proofs").createSignedUrls(paths, 600)
    : { data: [] };
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link key={t} href={`/admin/payments?status=${t}`}
            className={`chip px-4 py-1.5 text-sm capitalize ${t === status ? "bg-evol text-white" : "bg-white border border-line text-ink"}`}>{t}</Link>
        ))}
      </div>

      {sp.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{sp.error}</p>}
      {(rows ?? []).length === 0 && <p className="card text-sm text-muted">Nothing here.</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {(rows ?? []).map((r) => {
          const dup = (utrCount.get(r.utr) ?? 0) > 1;
          const img = urlFor.get(r.screenshot_path);
          return (
            <li key={r.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.full_name}</p>
                  <p className="text-xs text-muted">{r.phone}{r.college ? ` · ${r.college}` : ""}</p>
                </div>
                {r.code && <span className="rounded-lg bg-tint px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-evol">{r.code}</span>}
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">UTR</dt>
                <dd className="font-mono">{r.utr} {dup && <span className="chip ml-1 bg-red-100 text-evol">Duplicate UTR</span>}</dd>
                <dt className="text-muted">Payer</dt><dd>{r.payer_upi_name}</dd>
                <dt className="text-muted">Sent</dt>
                <dd>{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</dd>
                {r.reject_reason && (<><dt className="text-muted">Reason</dt><dd>{r.reject_reason}</dd></>)}
              </dl>

              {img && (
                <a href={img} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Payment screenshot from ${r.full_name}`} className="max-h-64 w-full bg-tint object-contain" />
                </a>
              )}

              {r.status !== "approved" && (
                <form action={approveRegistration}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn w-full">{dup ? "Approve anyway" : "Approve & generate code"}</button>
                </form>
              )}
              {r.status === "pending" && (
                <form action={rejectRegistration} className="flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="reason" className="input py-2 text-sm" placeholder="Reason (shown to learner)" maxLength={300} />
                  <button className="btn-ghost btn-sm shrink-0 text-evol">Reject</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
