import { createClient } from "@/lib/supabase/server";
import { deleteClass, saveClass } from "../actions";

const ist = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600e3);
  return d.toISOString().slice(0, 16); // yyyy-mm-ddThh:mm in IST for the input
};

export default async function ClassesAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("batches").select("id,name").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: classes } = batch ? await supabase.from("classes").select("*").eq("batch_id", batch.id).order("day_no") : { data: [] };
  const nextDay = Math.max(0, ...(classes ?? []).map((c) => c.day_no)) + 1;

  const renderForm = (c?: NonNullable<typeof classes>[number]) => (
    <form action={saveClass} className="card grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="batch_id" value={batch!.id} />
      <div><label className="label">Day</label><input className="input" type="number" name="day_no" min={1} max={30} defaultValue={c?.day_no ?? nextDay} required readOnly={!!c} /></div>
      <div className="sm:col-span-2"><label className="label">Title</label><input className="input" name="title" defaultValue={c?.title} required /></div>
      <div className="sm:col-span-2"><label className="label">Starts (IST)</label><input className="input" type="datetime-local" name="starts_at" defaultValue={ist(c?.starts_at ?? null)} /></div>
      <div className="sm:col-span-6"><label className="label">Join link (Meet / Zoom)</label><input className="input" type="url" name="join_link" defaultValue={c?.join_link ?? ""} placeholder="https://…" /></div>
      <div className="flex gap-2 sm:col-span-6"><button className="btn btn-sm">{c ? "Save changes" : "Add class"}</button></div>
    </form>
  );

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{error}</p>}
      {!batch ? <p className="card text-sm text-muted">Create a batch first.</p> : (
        <>
          <p className="text-sm text-muted">Classes for <b className="text-ink">{batch.name}</b>. Approved learners see these on their Learn screen, with the Join button.</p>
          {(classes ?? []).map((c) => (
            <div key={c.id} className="space-y-2">{renderForm(c)}
              <form action={deleteClass}><input type="hidden" name="id" value={c.id} /><button className="text-xs font-semibold text-evol underline">Delete day {c.day_no}</button></form></div>
          ))}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Add a class</h2>
          {renderForm()}
        </>
      )}
    </div>
  );
}
