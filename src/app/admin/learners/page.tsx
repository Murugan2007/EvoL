import { createClient } from "@/lib/supabase/server";

export default async function LearnersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("id,code,full_name,phone,college,utr,decided_at")
    .eq("status", "approved")
    .order("decided_at", { ascending: true });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{data?.length ?? 0} approved learners. Ask them to rename themselves to <b className="text-ink">CODE - FirstName</b> when joining.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">College</th><th className="p-3">UTR</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3 font-mono font-bold tracking-widest text-evol">{r.code}</td>
                <td className="p-3 font-medium">{r.full_name}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3 text-muted">{r.college ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{r.utr}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-4 text-muted">No approved learners yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
