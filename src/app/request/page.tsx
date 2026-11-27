import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/shop";
import { closeRequest, createRequest } from "./actions";

export const metadata = { title: "Request" };

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mine } = user
    ? await supabase.from("requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    : { data: [] };
  const ids = (mine ?? []).map((r) => r.id);
  const { data: offers } = ids.length
    ? await supabase.from("offers").select("id,request_id,maker_id,message,price_inr").in("request_id", ids)
    : { data: [] };

  return (
    <AppShell>
      <header className="px-5 pt-6"><Logo /></header>
      <section className="px-5 pt-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Got an idea or a problem?</h1>
        <p className="mt-1 text-sm text-muted">Tell us what you need. Verified makers will send you offers.</p>
      </section>

      <section className="px-5 pt-5">
        {user ? (
          <form action={createRequest} className="card space-y-3">
            <input className="input" name="title" required minLength={5} maxLength={100} placeholder="What do you need? (e.g. Smart plant waterer)" />
            <textarea className="input min-h-28" name="description" required minLength={20} maxLength={2000} placeholder="Describe it: what it should do, where you'll use it, any deadline…" />
            <input className="input" name="budget" type="number" min={1} placeholder="Budget in ₹ (optional)" />
            {error && <p className="text-sm font-medium text-evol" role="alert">{error}</p>}
            <button className="btn w-full">Post request</button>
          </form>
        ) : (
          <div className="card text-center"><p className="text-sm text-muted">Sign in to post a request.</p><Link href="/login?next=/request" className="btn btn-sm mt-3">Sign in</Link></div>
        )}
      </section>

      {(mine ?? []).length > 0 && (
        <section className="space-y-3 px-5 pt-6">
          <h2 className="font-semibold">Your requests</h2>
          {mine!.map((r) => {
            const o = (offers ?? []).filter((x) => x.request_id === r.id);
            return (
              <div key={r.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug">{r.title}</p>
                  <span className={`chip ${r.status === "open" ? "bg-green-100 text-green-800" : "bg-line text-muted"}`}>{r.status}</span>
                </div>
                <p className="text-sm text-muted">{r.budget_inr ? `Budget ${inr(r.budget_inr)} · ` : ""}{o.length} offer{o.length === 1 ? "" : "s"}</p>
                {o.map((x) => (
                  <div key={x.id} className="rounded-xl bg-tint p-3 text-sm">
                    <p className="font-semibold">{inr(x.price_inr)}</p>
                    <p className="mt-0.5">{x.message}</p>
                  </div>
                ))}
                {r.status === "open" && (
                  <form action={closeRequest}><input type="hidden" name="id" value={r.id} /><button className="btn-ghost btn-sm">Close request</button></form>
                )}
              </div>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}
