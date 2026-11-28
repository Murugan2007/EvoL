"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/certificate";

/** Crop to a centred square and shrink to 384px JPEG, so uploads stay tiny and fast. */
async function squarePhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height), out = 384;
  const c = document.createElement("canvas");
  c.width = c.height = out;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("fail"))), "image/jpeg", 0.88));
}

export function ProfileForm({ userId, initialName, initialAvatar, email }: { userId: string; initialName: string; initialAvatar: string | null; email: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const initials = (name || "E").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const shown = preview ?? avatarUrl(avatar);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg({ ok: false, text: "Please choose an image." });
    if (file.size > 15 * 1024 * 1024) return setMsg({ ok: false, text: "That photo is too large (max 15 MB)." });
    setBusy(true); setMsg(null);
    try {
      const blob = await squarePhoto(file);
      const supabase = createClient();
      const path = `${userId}/${Date.now()}.jpg`;
      const up = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
      if (error) throw error;
      if (avatar) await supabase.storage.from("avatars").remove([avatar]); // tidy up the old one
      setAvatar(path); setPreview(URL.createObjectURL(blob));
      setMsg({ ok: true, text: "Photo updated ✓" });
      router.refresh();
    } catch { setMsg({ ok: false, text: "Couldn't update the photo. Try a different image." }); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removePhoto() {
    setBusy(true); setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId);
    if (!error && avatar) await supabase.storage.from("avatars").remove([avatar]);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "Couldn't remove the photo." });
    setAvatar(null); setPreview(null); setMsg({ ok: true, text: "Photo removed" }); router.refresh();
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2 || clean.length > 60) return setMsg({ ok: false, text: "Name must be 2–60 characters." });
    setBusy(true); setMsg(null);
    const { error } = await createClient().from("profiles").update({ full_name: clean }).eq("id", userId);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "Couldn't save your name." });
    setName(clean); setMsg({ ok: true, text: "Name saved ✓" }); router.refresh();
  }

  return (
    <div className="space-y-4 rounded-[22px] border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {shown
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={shown} alt="Your photo" className="h-20 w-20 shrink-0 rounded-full object-cover" />
          : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4a4a] to-[#c81f26] text-3xl font-bold text-white">{initials}</span>}
        <div className="flex flex-col items-start gap-1.5">
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>{avatar ? "Change photo" : "Add photo"}</button>
          {avatar && <button type="button" className="text-sm font-semibold text-muted" disabled={busy} onClick={removePhoto}>Remove</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
      </div>
      <form onSubmit={saveName} className="space-y-2">
        <label className="label" htmlFor="pname">Your name</label>
        <input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required minLength={2} autoComplete="name" />
        <p className="text-xs text-muted">This is the name printed on your certificate when it’s issued, so use your full name as you want it to appear. Email: {email}</p>
        <button className="btn btn-sm" disabled={busy}>Save name</button>
      </form>
      {msg && <p className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-evol"}`} role="status">{msg.text}</p>}
    </div>
  );
}
