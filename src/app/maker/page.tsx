import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMaker } from "@/lib/auth";
import { inr, productImageUrl, CATEGORY_ICON } from "@/lib/shop";
import { deleteProduct, setHidden } from "./actions";

const tone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", live: "bg-green-100 text-green-800",
  hidden: "bg-line text-muted", rejected: "bg-red-100 text-evol",
};

export default async function MakerHome() {
  const me = await requireMaker();
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").eq("maker_id", me.id).order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My products</h1>
        <Link href="/maker/products/new" className="btn btn-sm">+ Add product</Link>
      </div>
      {(products ?? []).length === 0 && <p className="card text-sm text-muted">No products yet. Add your first one. We review it before it goes live.</p>}
      <ul className="space-y-3">
        {(products ?? []).map((p) => {
          const img = productImageUrl(p.image_path);
          return (
            <li key={p.id} className="card flex gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-tint">
                {img
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={img} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-3xl">{CATEGORY_ICON[p.category] ?? "✨"}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-sm text-muted">{inr(p.price_inr)} · stock {p.stock}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`chip ${tone[p.status]}`}>{p.status === "pending" ? "in review" : p.status}</span>
                  {(p.status === "live" || p.status === "pending") && (
                    <form action={setHidden}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="hide" value="1" /><button className="text-xs font-semibold text-muted underline">Hide</button></form>
                  )}
                  {p.status === "hidden" && (
                    <form action={setHidden}><input type="hidden" name="id" value={p.id} /><button className="text-xs font-semibold text-evol underline">Re-submit</button></form>
                  )}
                  <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="text-xs font-semibold text-evol underline">Delete</button></form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
