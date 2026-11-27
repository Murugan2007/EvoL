import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
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
    <AppShell>
      <header className="px-5 pt-6"><Logo /></header>
      <section className="px-5 pt-4">
        <form className="relative">
          <input name="q" defaultValue={q} placeholder="Search gadgets, kits, keychains…" className="input pl-10" />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">⌕</span>
          {c && <input type="hidden" name="c" value={c} />}
        </form>
      </section>

      <nav className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href="/market" className={`chip shrink-0 px-4 py-2 text-sm ${!c ? "bg-evol text-white" : "border border-line"}`}>All</Link>
        {CATEGORIES.map((k) => (
          <Link key={k} href={`/market?c=${encodeURIComponent(k)}`} className={`chip shrink-0 px-4 py-2 text-sm ${c === k ? "bg-evol text-white" : "border border-line"}`}>
            {CATEGORY_ICON[k]} {k}
          </Link>
        ))}
      </nav>

      <section className="px-5 pt-5">
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
                  <Link href={`/market/${p.id}`} className="block overflow-hidden rounded-2xl border border-line bg-white">
                    <div className="aspect-square bg-tint">
                      {img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={img} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                        : <div className="flex h-full items-center justify-center text-4xl">{CATEGORY_ICON[p.category] ?? "✨"}</div>}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.title}</p>
                      <p className="mt-1 flex items-center justify-between text-sm">
                        <b>{inr(p.price_inr)}</b>
                        {p.stock === 0 && <span className="text-xs text-muted">Sold out</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
