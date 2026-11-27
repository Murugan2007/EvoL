import Link from "next/link";
import { Icon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_ICON, inr, productImageUrl } from "@/lib/shop";

export const metadata = { title: "Marketplace" };

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q, c } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("products").select("id,title,price_inr,category,image_path,stock").eq("status", "live").order("created_at", { ascending: false }).limit(60);
  if (c) query = query.eq("category", c);
  if (q) query = query.ilike("title", `%${q.replace(/[%,]/g, " ").slice(0, 60)}%`);
  const { data: products } = await query;

  return (
    <>
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div>
          <h1 className="text-[28px] font-bold leading-none tracking-tight">Marketplace</h1>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted"><Icon name="shield" className="h-3.5 w-3.5 text-evol" />Payment held until it reaches you</p>
        </div>
        <Link href="/become-a-maker" className="mt-1 rounded-full border border-evol/60 bg-white px-4 py-2 text-sm font-bold text-evol">Sell yours</Link>
      </header>

      <div className="mx-5 mt-4 flex gap-2">
        <form className="relative flex-1">
          <input name="q" defaultValue={q} placeholder="Search kits, gadgets, parts" className="input rounded-2xl py-3 pr-10" />
          {c && <input type="hidden" name="c" value={c} />}
          <button className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Search"><Icon name="search" className="h-[18px] w-[18px]" /></button>
        </form>
        <span className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-line bg-white"><Icon name="sliders" /></span>
      </div>

      <section className="mx-5 mt-4 flex items-center gap-3 rounded-[22px] bg-maroon p-4 text-white">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-evol"><Icon name="shield" className="h-6 w-6" /></span>
        <div><p className="font-bold leading-tight">Checked makers only</p><p className="text-xs text-white/75">Look for the Verified badge before you buy.</p></div>
      </section>

      <nav className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href="/market" className={`chip shrink-0 px-4 py-2 text-sm ${!c ? "bg-evol text-white" : "border border-line bg-white"}`}>All</Link>
        {CATEGORIES.map((k) => (
          <Link key={k} href={`/market?c=${encodeURIComponent(k)}`} className={`chip shrink-0 px-4 py-2 text-sm ${c === k ? "bg-evol text-white" : "border border-line bg-white"}`}>{k}</Link>
        ))}
      </nav>

      <section className="px-5 pt-4">
        {(products ?? []).length === 0 ? (
          <div className="card text-center text-sm text-muted">
            <p className="text-3xl">🛠️</p>
            <p className="mt-2 font-semibold text-ink">Nothing here yet</p>
            <p>Makers are joining now. Want to sell your builds?</p>
            <Link href="/become-a-maker" className="btn btn-sm mt-3">Become a maker</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {products!.map((p) => {
              const img = productImageUrl(p.image_path);
              return (
                <li key={p.id}>
                  <Link href={`/market/${p.id}`} className="block rounded-[22px] border border-line bg-white p-2.5 shadow-sm">
                    <div className="aspect-[1.1] overflow-hidden rounded-2xl bg-[#fde9e9]">
                      {img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={img} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                        : <div className="flex h-full items-center justify-center text-4xl">{CATEGORY_ICON[p.category] ?? "✨"}</div>}
                    </div>
                    <p className="mt-2.5 line-clamp-2 min-h-[2.4em] text-[15px] font-semibold leading-tight">{p.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Icon name="check" className="h-3 w-3" />Verified maker</p>
                    <div className="mt-2 flex items-center justify-between">
                      <b className="text-lg">{inr(p.price_inr)}</b>
                      <span className="rounded-lg border border-evol/50 px-3 py-1 text-sm font-bold text-evol">{p.stock === 0 ? "Sold out" : "Add"}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
