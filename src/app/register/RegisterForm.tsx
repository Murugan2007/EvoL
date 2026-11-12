"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  batchId: string; userId: string; price: number; upiId: string;
  defaults: { name: string; phone: string; college: string };
};

export function RegisterForm({ batchId, userId, price, upiId, defaults }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    const file = f.get("proof") as File;
    const utr = String(f.get("utr")).replace(/\s/g, "").toUpperCase();
    const phone = String(f.get("phone")).trim();

    if (!/^[A-Z0-9]{10,30}$/.test(utr)) return setErr("UTR / transaction ID should be 10–30 letters or digits.");
    if (!/^[0-9+ -]{10,15}$/.test(phone)) return setErr("Enter a valid phone number.");
    if (!file || !file.size) return setErr("Please attach your payment screenshot.");
    if (file.size > 3 * 1024 * 1024) return setErr("Screenshot must be under 3 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErr("Screenshot must be a JPG, PNG or WebP image.");

    setBusy(true);
    const supabase = createClient();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const up = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setErr("Couldn't upload the screenshot. Try again."); }

    const { error } = await supabase.from("registrations").insert({
      user_id: userId,
      batch_id: batchId,
      full_name: String(f.get("name")).trim(),
      phone,
      college: String(f.get("college")).trim() || null,
      utr,
      payer_upi_name: String(f.get("payer")).trim(),
      screenshot_path: path,
      declaration_ok: f.get("declare") === "on",
    });
    if (error) {
      await supabase.storage.from("payment-proofs").remove([path]);
      setBusy(false);
      return setErr(error.code === "23505" ? "You've already registered for this batch." : "Something went wrong. Check your details and try again.");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="card bg-tint">
        <p className="text-sm font-semibold">Step 1 — Pay ₹{price} by UPI</p>
        {upiId && <p className="mt-1 text-sm">UPI ID: <b className="select-all">{upiId}</b></p>}
        <p className="mt-1 text-xs text-muted">Then fill the details below with the UTR / transaction ID from your payment app.</p>
      </div>

      <div><label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" className="input" required minLength={2} maxLength={80} defaultValue={defaults.name} autoComplete="name" /></div>
      <div><label className="label" htmlFor="phone">Phone (WhatsApp)</label>
        <input id="phone" name="phone" className="input" required inputMode="tel" defaultValue={defaults.phone} autoComplete="tel" /></div>
      <div><label className="label" htmlFor="college">College / school <span className="text-muted">(optional)</span></label>
        <input id="college" name="college" className="input" maxLength={120} defaultValue={defaults.college} /></div>

      <hr className="border-line" />
      <div><label className="label" htmlFor="utr">UTR / Transaction ID</label>
        <input id="utr" name="utr" className="input uppercase" required placeholder="e.g. 412345678901" autoCapitalize="characters" /></div>
      <div><label className="label" htmlFor="payer">Name shown on the payment (payer UPI name)</label>
        <input id="payer" name="payer" className="input" required minLength={2} maxLength={80} /></div>
      <div><label className="label" htmlFor="proof">Payment screenshot</label>
        <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp" required className="input file:mr-3 file:rounded-lg file:border-0 file:bg-tint file:px-3 file:py-1.5 file:font-semibold file:text-evol" /></div>

      <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm leading-relaxed">
        <input type="checkbox" name="declare" required className="mt-1 h-4 w-4 accent-[#d91f26]" />
        <span>I declare that I have paid the registration fee of ₹{price}. I understand I must attend at least 50% of the classes and complete the course project to receive the completion certificate, and that the fee is non-refundable.</span>
      </label>

      {err && <p className="text-sm font-medium text-evol" role="alert">{err}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Submitting…" : "Submit for approval"}</button>
    </form>
  );
}
