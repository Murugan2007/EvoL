"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/shop";

export function ProductForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    const file = f.get("image") as File;
    if (file?.size) {
      if (file.size > 2 * 1024 * 1024) return setErr("Image must be under 2 MB.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErr("Image must be JPG, PNG or WebP.");
    }
    setBusy(true);
    const supabase = createClient();
    let image_path: string | null = null;
    if (file?.size) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      image_path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("product-images").upload(image_path, file, { contentType: file.type });
      if (up.error) { setBusy(false); return setErr("Couldn't upload the image. Try again."); }
    }
    const { error } = await supabase.from("products").insert({
      maker_id: userId,
      title: String(f.get("title")).trim(),
      description: String(f.get("description")).trim(),
      category: String(f.get("category")),
      price_inr: Math.round(Number(f.get("price"))),
      stock: Math.max(0, Math.round(Number(f.get("stock")))),
      image_path,
    });
    if (error) { setBusy(false); return setErr("Check the details: title 3+ chars, description 10+ chars, price ₹1–₹5,00,000."); }
    router.push("/maker");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" className="input" required minLength={3} maxLength={80} /></div>
      <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" className="input min-h-28" required minLength={10} maxLength={1000} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="price">Price (₹)</label><input id="price" name="price" type="number" min={1} className="input" required /></div>
        <div><label className="label" htmlFor="stock">Stock</label><input id="stock" name="stock" type="number" min={0} defaultValue={1} className="input" required /></div>
      </div>
      <div><label className="label" htmlFor="category">Category</label>
        <select id="category" name="category" className="input">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label" htmlFor="image">Photo <span className="text-muted">(JPG/PNG/WebP, max 2 MB)</span></label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded-lg file:border-0 file:bg-tint file:px-3 file:py-1.5 file:font-semibold file:text-evol" /></div>
      {err && <p className="text-sm font-medium text-evol" role="alert">{err}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</button>
    </form>
  );
}
