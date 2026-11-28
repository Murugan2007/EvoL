import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { importAttendance, saveAttendance } from "../actions";

export default async function AttendanceAdmin({ searchParams }: { searchParams: Promise<{ class?: string; error?: string; done?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("batches").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: classes } = batch ? await supabase.from("classes").select("id,day_no,title").eq("batch_id", batch.id).order("day_no") : { data: [] };
  const current = (classes ?? []).find((c) => c.id === sp.class);

  const { data: learners } = batch
    ? await supabase.from("registrations").select("id,code,full_name").eq("batch_id", batch.id).eq("status", "approved").order("code")
    : { data: [] };
  const { data: att } = current ? await supabase.from("attendance").select("registration_id,attended").eq("class_id", current.id) : { data: [] };
  const here = new Set((att ?? []).filter((a) => a.attended).map((a) => a.registration_id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(classes ?? []).length === 0 && <p className="card text-sm text-muted">Add classes first (Classes tab).</p>}
        {(classes ?? []).map((c) => (
          <Link key={c.id} href={`/admin/attendance?class=${c.id}`} className={`chip px-4 py-1.5 text-sm ${c.id === current?.id ? "bg-evol text-white" : "border border-line bg-white"}`}>Day {c.day_no}</Link>
        ))}
      </div>
      {sp.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{sp.error}</p>}
      {sp.done && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Marked present: {sp.done.replace("of", " of ")} codes found in the report matched approved learners.</p>}

      {current && (
        <>
          <form action={importAttendance} className="card space-y-2">
            <p className="font-semibold">Import from the meeting report · Day {current.day_no}: {current.title}</p>
            <p className="text-sm text-muted">Paste the participant list (names like “EV7K3Q - Asha”). Every learner code found is marked present.</p>
            <input type="hidden" name="class_id" value={current.id} />
            <textarea name="report" className="input min-h-28 font-mono text-sm" placeholder={"EV7K3Q - Asha\nEV9M2P - Rahul\n…"} required />
            <button className="btn btn-sm">Mark present from list</button>
          </form>

          <form action={saveAttendance} className="card space-y-3">
            <p className="font-semibold">Or tick manually ({here.size}/{learners?.length ?? 0} present)</p>
            <input type="hidden" name="class_id" value={current.id} />
            <ul className="grid gap-1 sm:grid-cols-2">
              {(learners ?? []).map((l) => (
                <li key={l.id}>
                  <input type="hidden" name="all" value={l.id} />
                  <label className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-tint">
                    <input type="checkbox" name="present" value={l.id} defaultChecked={here.has(l.id)} className="h-4 w-4 accent-[#d91f26]" />
                    <span className="font-mono text-sm font-bold text-evol">{l.code}</span><span className="text-sm">{l.full_name}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button className="btn btn-sm">Save attendance</button>
          </form>
        </>
      )}
    </div>
  );
}
