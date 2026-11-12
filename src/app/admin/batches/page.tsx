import { createClient } from "@/lib/supabase/server";
import { createBatch, updateBatch } from "../actions";

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: batches } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
  const { data: regs } = await supabase.from("registrations").select("batch_id,status");
  const taken = (id: string) => (regs ?? []).filter((r) => r.batch_id === id && r.status === "approved").length;

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{error}</p>}

      <section className="space-y-4">
        {(batches ?? []).map((b) => (
          <form key={b.id} action={updateBatch} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input type="hidden" name="id" value={b.id} />
            <div className="sm:col-span-2 lg:col-span-5">
              <p className="font-semibold">{b.name}</p>
              <p className="text-sm text-muted">{b.course_title} · {taken(b.id)} of {b.seats} seats taken</p>
            </div>
            <div><label className="label">Seats</label><input className="input" type="number" name="seats" min={1} defaultValue={b.seats} /></div>
            <div><label className="label">Price (₹)</label><input className="input" type="number" name="price_inr" min={0} defaultValue={b.price_inr} /></div>
            <div><label className="label">Starts</label><input className="input" type="date" name="starts_on" defaultValue={b.starts_on ?? ""} /></div>
            <div><label className="label">Project due</label><input className="input" type="date" name="project_due_on" defaultValue={b.project_due_on ?? ""} /></div>
            <div className="flex items-end justify-between gap-3">
              <label className="flex items-center gap-2 pb-3 text-sm font-medium">
                <input type="checkbox" name="registration_open" defaultChecked={b.registration_open} className="h-4 w-4 accent-[#d91f26]" /> Registration open
              </label>
              <button className="btn btn-sm mb-1.5">Save</button>
            </div>
          </form>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">New batch</h2>
        <form action={createBatch} className="card grid gap-3 sm:grid-cols-2">
          <div><label className="label">Batch name</label><input className="input" name="name" required placeholder="Batch 2" /></div>
          <div><label className="label">Course title</label><input className="input" name="course_title" required defaultValue="Absolute Basics of Electronics & IoT" /></div>
          <div><label className="label">Price (₹)</label><input className="input" type="number" name="price_inr" min={0} defaultValue={99} required /></div>
          <div><label className="label">Seats</label><input className="input" type="number" name="seats" min={1} defaultValue={100} required /></div>
          <div><label className="label">Start date</label><input className="input" type="date" name="starts_on" /></div>
          <div className="flex items-end"><button className="btn w-full">Create batch</button></div>
        </form>
      </section>
    </div>
  );
}
