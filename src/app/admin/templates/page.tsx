import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_COLS, templateUrl, type CertTemplate } from "@/lib/certificate";
import { NewTemplate, TemplateEditor, TemplateRowActions } from "./TemplateTools";

export const metadata = { title: "Certificate templates" };

export default async function TemplatesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("certificate_templates").select(TEMPLATE_COLS).order("created_at", { ascending: false });
  const templates = (data ?? []) as CertTemplate[];
  const editing = edit ? templates.find((t) => t.id === edit) : undefined;

  if (editing) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://evolindia.vercel.app").replace(/\/$/, "");
    const qr = await QRCode.toDataURL(`${site}/verify/EVL-SAMPLE`, { margin: 1, width: 600, color: { dark: "#000000", light: "#ffffff" } });
    return (
      <div className="space-y-4">
        <Link href="/admin/templates" className="text-sm font-semibold text-evol">‹ All templates</Link>
        <h2 className="text-xl font-bold">{editing.name}</h2>
        <TemplateEditor key={editing.id} template={editing} certIdSample="EVL-XXXX-XXXX" qrDataUrl={qr} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">The <b>active</b> template is used for every certificate. The learner’s name is printed automatically when you issue a certificate to anyone eligible.</p>
      <NewTemplate />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Your templates ({templates.length})</h2>
        {templates.length === 0 && <p className="card text-sm text-muted">No template yet. Until you add one, certificates use the built-in Evol design.</p>}
        {templates.map((t) => (
          <div key={t.id} className="card flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={templateUrl(t.image_path)} alt="" className="h-20 w-32 rounded-lg border border-line object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.name} {t.is_active && <span className="chip ml-1 bg-green-100 text-green-800">Active</span>}</p>
              <Link href={`/admin/templates?edit=${t.id}`} className="text-sm font-semibold text-evol">Edit name placement ›</Link>
            </div>
            <TemplateRowActions id={t.id} path={t.image_path} active={t.is_active} />
          </div>
        ))}
      </section>
    </div>
  );
}
