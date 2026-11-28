import { createClient } from "@/lib/supabase/server";
import { reviewSubmission } from "../actions";

export default async function SubmissionsAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: subs } = await supabase.from("submissions").select("*").order("submitted_at", { ascending: false });
  const ids = (subs ?? []).map((s) => s.registration_id);
  const { data: regs } = ids.length ? await supabase.from("registrations").select("id,code,full_name").in("id", ids) : { data: [] };
  const who = new Map((regs ?? []).map((r) => [r.id, r]));
  const tone: Record<string, string> = { submitted: "bg-amber-100 text-amber-800", accepted: "bg-green-100 text-green-800", needs_work: "bg-red-100 text-evol" };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{error}</p>}
      {(subs ?? []).length === 0 && <p className="card text-sm text-muted">No submissions yet.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {(subs ?? []).map((s) => {
          const r = who.get(s.registration_id);
          return (
            <li key={s.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{r?.full_name} <span className="font-mono text-sm text-evol">{r?.code}</span></p>
                <span className={`chip ${tone[s.status]}`}>{s.status.replace("_", " ")}</span>
              </div>
              <a href={s.link} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm font-semibold text-evol">{s.link}</a>
              {s.note && <p className="text-sm">{s.note}</p>}
              <div className="flex gap-2 pt-1">
                {["accepted", "needs_work"].map((st) => (
                  <form key={st} action={reviewSubmission}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value={st} />
                    <button className={st === "accepted" ? "btn btn-sm" : "btn-ghost btn-sm"}>{st === "accepted" ? "Accept" : "Needs work"}</button></form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
