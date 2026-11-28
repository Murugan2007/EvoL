"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { drawCertificate, loadImage, templateUrl, type CertTemplate } from "@/lib/certificate";

/** Upload a new certificate PNG/JPG as a template. */
export function NewTemplate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    const file = f.get("file") as File;
    if (!file?.size) return setErr("Choose the certificate image first.");
    if (!["image/png", "image/jpeg"].includes(file.type)) return setErr("Use a PNG or JPG.");
    if (file.size > 8 * 1024 * 1024) return setErr("Image must be under 8 MB.");
    setBusy(true);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`;
    const up = await supabase.storage.from("certificate-templates").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setErr("Upload failed: " + up.error.message); }
    const { data, error } = await supabase.from("certificate_templates")
      .insert({ name: String(f.get("name")).trim() || "Certificate", image_path: path }).select("id").single();
    if (error || !data) { setBusy(false); return setErr("Couldn't save the template: " + (error?.message ?? "")); }
    router.push(`/admin/templates?edit=${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <p className="font-bold">Upload a certificate design</p>
      <p className="text-sm text-muted">Make the design in Canva or any tool, leave the learner’s name <b>blank</b>, and export as PNG. You’ll mark where the name goes next.</p>
      <input name="name" className="input" placeholder="Template name, e.g. Founding batch" maxLength={60} />
      <input name="file" type="file" accept="image/png,image/jpeg" className="input file:mr-3 file:rounded-lg file:border-0 file:bg-tint file:px-3 file:py-1.5 file:font-semibold file:text-evol" />
      {err && <p className="text-sm font-medium text-evol" role="alert">{err}</p>}
      <button className="btn btn-sm" disabled={busy}>{busy ? "Uploading…" : "Upload and place the name"}</button>
    </form>
  );
}

/** Click or drag on the preview to place the name (and optional QR); settings update live. */
export function TemplateEditor({ template, certIdSample, qrDataUrl }: { template: CertTemplate; certIdSample: string; qrDataUrl: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const qrRef = useRef<HTMLImageElement | null>(null);
  const [t, setT] = useState<CertTemplate>(template);
  const [sample, setSample] = useState("Murugan Umapathy");
  const [target, setTarget] = useState<"name" | "qr">("name");
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    let off = false;
    Promise.all([loadImage(templateUrl(template.image_path)), loadImage(qrDataUrl)]).then(([i, q]) => {
      if (off) return;
      imgRef.current = i; qrRef.current = q; setReady(true);
    }).catch(() => setMsg("Couldn't load the image."));
    return () => { off = true; };
  }, [template.image_path, qrDataUrl]);

  useEffect(() => {
    if (!ready || !canvasRef.current || !imgRef.current) return;
    drawCertificate(canvasRef.current, imgRef.current, t, sample || "Learner Name", qrRef.current, certIdSample, { name: target === "name", qr: target === "qr" && t.show_qr });
  }, [ready, t, sample, target, certIdSample]);

  const set = <K extends keyof CertTemplate>(k: K, v: CertTemplate[K]) => setT((p) => ({ ...p, [k]: v }));
  const place = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setT((p) => (target === "name" ? { ...p, name_x: +x.toFixed(2), name_y: +y.toFixed(2) } : { ...p, qr_x: +x.toFixed(2), qr_y: +y.toFixed(2) }));
  };

  async function save(activate: boolean) {
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.from("certificate_templates").update({
      name: t.name, name_x: t.name_x, name_y: t.name_y, name_size: t.name_size, name_max_w: t.name_max_w,
      name_color: t.name_color, name_weight: t.name_weight, show_qr: t.show_qr, qr_x: t.qr_x, qr_y: t.qr_y, qr_size: t.qr_size,
    }).eq("id", t.id);
    if (!error && activate) {
      const r = await supabase.rpc("activate_certificate_template", { p_id: t.id });
      if (r.error) { setBusy(false); return setMsg(r.error.message); }
    }
    setBusy(false);
    if (error) return setMsg("Couldn't save: " + error.message);
    setMsg(activate ? "Saved and set as the active template ✓" : "Saved ✓");
    router.refresh();
  }

  const range = (label: string, k: "name_size" | "name_max_w" | "qr_size", min: number, max: number, step: number, suffix = "%") => (
    <label className="block text-sm"><span className="flex justify-between"><span className="font-medium">{label}</span><span className="text-muted">{t[k]}{suffix}</span></span>
      <input type="range" min={min} max={max} step={step} value={t[k]} onChange={(e) => set(k, Number(e.target.value))} className="w-full accent-[#d91f26]" /></label>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["name", "qr"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTarget(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${target === k ? "bg-space text-white" : "border border-line bg-white"}`}>
            {k === "name" ? "Placing: name" : "Placing: QR code"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">Tap or drag on the certificate to move the {target === "name" ? "name (the red dashed box; long names shrink to fit it)" : "QR code (blue box)"}.</p>
      <canvas ref={canvasRef}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); place(e); }}
        onPointerMove={(e) => dragging.current && place(e)}
        onPointerUp={() => { dragging.current = false; }}
        className={`h-auto w-full touch-none cursor-crosshair rounded-lg border border-line bg-white ${ready ? "" : "hidden"}`} />
      {!ready && <p className="text-sm text-muted">Loading preview…</p>}

      <div className="card grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2"><span className="font-medium">Try a name</span>
          <input className="input mt-1" value={sample} onChange={(e) => setSample(e.target.value)} maxLength={60} /></label>
        {range("Name size", "name_size", 1, 12, 0.1)}
        {range("Name box width (for long names)", "name_max_w", 20, 100, 1)}
        <label className="block text-sm"><span className="font-medium">Name colour</span>
          <input type="color" value={t.name_color} onChange={(e) => set("name_color", e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-line" /></label>
        <label className="block text-sm"><span className="font-medium">Weight</span>
          <select className="input mt-1" value={t.name_weight} onChange={(e) => set("name_weight", Number(e.target.value))}>
            <option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={600}>Semibold</option><option value={700}>Bold</option></select></label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input type="checkbox" checked={t.show_qr} onChange={(e) => { set("show_qr", e.target.checked); if (e.target.checked) setTarget("qr"); }} className="h-4 w-4 accent-[#d91f26]" />
          Print a verification QR code + certificate ID (recommended)</label>
        {t.show_qr && <div className="sm:col-span-2">{range("QR size", "qr_size", 4, 25, 0.5)}</div>}
      </div>

      {msg && <p className="text-sm font-medium" role="status">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => save(true)}>Save and use for all certificates</button>
        <button className="btn-ghost" disabled={busy} onClick={() => save(false)}>Save only</button>
      </div>
    </div>
  );
}

export function TemplateRowActions({ id, path, active }: { id: string; path: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function activate() {
    setBusy(true);
    await createClient().rpc("activate_certificate_template", { p_id: id });
    setBusy(false); router.refresh();
  }
  async function remove() {
    if (!confirm("Delete this template? Existing certificates will use the active template.")) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("certificate_templates").delete().eq("id", id);
    await supabase.storage.from("certificate-templates").remove([path]);
    setBusy(false); router.refresh();
  }
  return (
    <div className="flex gap-2">
      {!active && <button className="btn-ghost btn-sm" disabled={busy} onClick={activate}>Use this</button>}
      <button className="btn-ghost btn-sm text-evol" disabled={busy} onClick={remove}>Delete</button>
    </div>
  );
}
