import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr, productImageUrl } from "@/lib/shop";
import { reviewProduct } from "../actions";

const tabs = ["pending", "live", "rejected", "hidden"] as const;

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const sp = await searchParams;
  const status = tabs.includes(sp.status as (typeof tabs)[number]) ? sp.status! : "pending";
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("status", status).order("created_at");

  const Btn = ({ id, to, label, ghost }: { id: string; to: string; label: string; ghost?: boolean }) => (
    <form action={reviewProduct}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} />
      <button className={ghost ? "btn-ghost btn-sm text-evol" : "btn btn-sm"}>{label}</button></form>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => <Link key={t} href={`/admin/products?status=${t}`} className={`chip px-4 py-1.5 text-sm capitalize ${t === status ? "bg-evol text-white" : "border border-line bg-white"}`}>{t}</Link>)}
      </div>
      {sp.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{sp.error}</p>}
      {(data ?? []).length === 0 && <p className="card text-sm text-muted">Nothing here.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((p) => {
          const img = productImageUrl(p.image_path);
          return (
            <li key={p.id} className="card space-y-3">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={p.title} className="max-h-56 w-full rounded-xl object-cover" />
              )}
              <div><p className="font-semibold">{p.title} <span className="text-muted">· {inr(p.price_inr)}</span></p>
                <p className="text-xs text-muted">{p.category} · stock {p.stock}</p>
                <p className="mt-1 whitespace-pre-line text-sm">{p.description}</p></div>
              <div className="flex gap-2">
                {p.status !== "live" && <Btn id={p.id} to="live" label="Publish" />}
                {p.status === "live" && <Btn id={p.id} to="hidden" label="Take down" ghost />}
                {p.status === "pending" && <Btn id={p.id} to="rejected" label="Reject" ghost />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
