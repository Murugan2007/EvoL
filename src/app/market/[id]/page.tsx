import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ICON, inr, productImageUrl } from "@/lib/shop";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: p } = await supabase.from("products").select("*").eq("id", id).eq("status", "live").maybeSingle();
  if (!p) notFound();
  const { data: maker } = await supabase.rpc("maker_name", { p_id: p.maker_id });
  const img = productImageUrl(p.image_path);

  return (
    <main className="mx-auto max-w-md pb-28">
      <div className="relative aspect-square bg-tint">
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt={p.title} className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-7xl">{CATEGORY_ICON[p.category] ?? "✨"}</div>}
        <Link href="/market" className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow" aria-label="Back">‹</Link>
      </div>
      <div className="space-y-3 px-5 pt-5">
        <span className="chip bg-tint text-evol">{p.category}</span>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{p.title}</h1>
        <p className="text-sm text-muted">Made by <b className="text-ink">{maker ?? "an Evol maker"}</b></p>
        <p className="whitespace-pre-line leading-relaxed">{p.description}</p>
        <div className="card bg-tint text-sm">🛡️ Buyer protection: payment will be held until your item is delivered. Checkout opens soon.</div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <p className="text-2xl font-bold">{inr(p.price_inr)}</p>
          <button className="btn flex-1" disabled>{p.stock === 0 ? "Sold out" : "Checkout opens soon"}</button>
        </div>
      </div>
    </main>
  );
}
