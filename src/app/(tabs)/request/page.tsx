import Link from "next/link";
import { Icon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { inr } from "@/lib/shop";
import { closeRequest, createRequest } from "./actions";

export const metadata = { title: "Request" };

const kinds = [{ v: "fix", l: "Fix it" }, { v: "improve", l: "Improve it" }, { v: "invent", l: "Invent it" }];

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [uid, supabase] = await Promise.all([getUserId(), createClient()]);

  const { data: mine } = uid
    ? await supabase.from("requests").select("*").eq("user_id", uid).order("created_at", { ascending: false })
    : { data: [] };
  const ids = (mine ?? []).map((r) => r.id);
  const { data: offers } = ids.length
    ? await supabase.from("offers").select("id,request_id,message,price_inr").in("request_id", ids)
    : { data: [] };

  return (
    <>
      <header className="px-5 pt-6">
        <h1 className="text-[28px] font-bold leading-none tracking-tight">Request</h1>
        <p className="mt-1.5 text-xs leading-snug text-muted">Tell us what you wish existed. Makers reply with a plan and a price.</p>
      </header>

      <section className="px-5 pt-4">
        {uid ? (
          <form action={createRequest} className="space-y-3">
            <div className="rounded-[22px] border border-line bg-white p-4 shadow-sm">
              <label htmlFor="d" className="text-[15px] font-bold">What should we build or fix?</label>
              <textarea id="d" name="description" required minLength={20} maxLength={2000} rows={3}
                placeholder="Example: A pill box that reminds my grandmother when to take her medicine"
                className="mt-2 w-full resize-none rounded-xl border border-line bg-[#faf7f7] p-3 text-[15px] outline-none focus:border-evol" />
              <div className="mt-3 flex gap-2">
                {kinds.map((k, i) => (
                  <label key={k.v} className="cursor-pointer">
                    <input type="radio" name="kind" value={k.v} defaultChecked={i === 2} className="peer sr-only" />
                    <span className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-semibold peer-checked:border-evol peer-checked:bg-evol peer-checked:text-white">{k.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-bold" htmlFor="b">Budget (₹)</label>
                <input id="b" name="budget" type="number" min={1} placeholder="e.g. 1500" className="input rounded-2xl" /></div>
              <div><label className="mb-1 block text-xs font-bold" htmlFor="n">Need it by</label>
                <input id="n" name="need_by" type="date" className="input rounded-2xl" /></div>
            </div>
            {error && <p className="text-sm font-medium text-evol" role="alert">{error}</p>}
            <button className="btn w-full rounded-2xl py-3.5 text-base">Post request</button>
          </form>
        ) : (
          <div className="card text-center"><p className="text-sm text-muted">Sign in to post a request.</p><Link href="/login?next=/request" className="btn btn-sm mt-3">Sign in</Link></div>
        )}
      </section>

      <section className="px-5 pt-5">
        <h2 className="mb-2 text-lg font-bold tracking-tight">How it works</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[{ i: "chat", t: "Makers reply" }, { i: "check", t: "You pick one" }, { i: "shield", t: "Pay safely" }].map((s) => (
            <div key={s.t} className="rounded-2xl border border-line bg-white p-3 text-[13px] font-semibold leading-tight shadow-sm">
              <Icon name={s.i} className="mb-2 h-5 w-5 text-evol" />{s.t}
            </div>
          ))}
        </div>
      </section>

      {(mine ?? []).length > 0 && (
        <section className="space-y-3 px-5 pt-5">
          <h2 className="text-lg font-bold tracking-tight">Your requests</h2>
          {mine!.map((r) => {
            const o = (offers ?? []).filter((x) => x.request_id === r.id);
            return (
              <div key={r.id} className="rounded-[22px] border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold leading-snug">{r.title}</p>
                  <span className={`chip shrink-0 ${r.status === "open" ? "bg-[#fde3e3] text-evol" : "bg-line text-muted"}`}>{r.status === "open" ? "Open" : "Closed"}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{o.length} maker{o.length === 1 ? "" : "s"} replied{r.budget_inr ? ` · budget ${inr(r.budget_inr)}` : ""}</p>
                {o.map((x) => (
                  <div key={x.id} className="mt-2 rounded-xl bg-[#fdf1f1] p-3 text-sm"><p className="font-bold">{inr(x.price_inr)}</p><p className="mt-0.5">{x.message}</p></div>
                ))}
                {r.status === "open" && (
                  <form action={closeRequest} className="mt-3"><input type="hidden" name="id" value={r.id} /><button className="btn-ghost btn-sm">Close request</button></form>
                )}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
