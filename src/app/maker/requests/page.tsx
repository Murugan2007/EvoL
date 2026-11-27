import { createClient } from "@/lib/supabase/server";
import { requireMaker } from "@/lib/auth";
import { inr } from "@/lib/shop";
import { sendOffer } from "../actions";

export const metadata = { title: "Requests" };

export default async function MakerRequests({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const me = await requireMaker();
  const supabase = await createClient();
  const { data: reqs } = await supabase.from("requests").select("*").eq("status", "open").neq("user_id", me.id).order("created_at", { ascending: false });
  const { data: mine } = await supabase.from("offers").select("request_id,price_inr").eq("maker_id", me.id);
  const sent = new Map((mine ?? []).map((o) => [o.request_id, o.price_inr]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Open requests</h1>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{error}</p>}
      {(reqs ?? []).length === 0 && <p className="card text-sm text-muted">No open requests right now.</p>}
      {(reqs ?? []).map((r) => (
        <div key={r.id} className="card space-y-2">
          <p className="font-semibold">{r.title}</p>
          <p className="whitespace-pre-line text-sm">{r.description}</p>
          <p className="text-xs text-muted">{r.budget_inr ? `Budget ${inr(r.budget_inr)}` : "No budget given"} · {new Date(r.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
          {sent.has(r.id) ? (
            <span className="chip bg-green-100 text-green-800">Offer sent · {inr(sent.get(r.id)!)}</span>
          ) : (
            <form action={sendOffer} className="space-y-2 border-t border-line pt-3">
              <input type="hidden" name="request_id" value={r.id} />
              <textarea name="message" required minLength={10} maxLength={800} className="input min-h-20 text-sm" placeholder="How would you build it? Timeline, parts, what's included…" />
              <div className="flex gap-2">
                <input name="price" type="number" min={1} required className="input py-2 text-sm" placeholder="Your price (₹)" />
                <button className="btn btn-sm shrink-0">Send offer</button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
