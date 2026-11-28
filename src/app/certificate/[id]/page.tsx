import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Certificate of Completion", robots: { index: false } };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certId = decodeURIComponent(id).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { p_cert_id: certId });
  const c = Array.isArray(data) ? data[0] : null;
  if (!c || !c.valid) notFound();

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://evolindia.vercel.app").replace(/\/$/, "");
  const qr = await QRCode.toString(`${site}/verify/${certId}`, { type: "svg", margin: 0, color: { dark: "#7a1519", light: "#0000" } });
  const date = new Date(c.issued_on).toLocaleDateString("en-IN", { dateStyle: "long" });

  return (
    <main className="min-h-dvh bg-[#f4efef] p-4 print:bg-white print:p-0">
      <style>{`@page{size:A4 landscape;margin:0}@media print{.noprint{display:none!important}.sheet{box-shadow:none!important;width:297mm!important;height:210mm!important;max-width:none!important;aspect-ratio:auto!important}}`}</style>
      <div className="noprint mx-auto mb-4 flex max-w-4xl items-center justify-between"><p className="text-sm text-muted">Use “Save as PDF” in the print window.</p><PrintButton /></div>
      <section className="sheet relative mx-auto flex aspect-[297/210] w-full max-w-4xl flex-col items-center justify-between overflow-hidden bg-white p-[5%] text-center shadow-xl">
        <div className="pointer-events-none absolute inset-[2.5%] rounded-sm border-[3px] border-maroon" />
        <div className="pointer-events-none absolute inset-[3.5%] rounded-sm border border-evol/40" />
        <div className="relative flex flex-col items-center gap-2">
          <Logo size={56} />
          <p className="text-[clamp(10px,1.6vw,16px)] font-semibold uppercase tracking-[0.35em] text-maroon">Evol</p>
        </div>
        <div className="relative">
          <p className="text-[clamp(18px,3.6vw,38px)] font-bold tracking-tight text-maroon">Certificate of Completion</p>
          <p className="mt-[2%] text-[clamp(10px,1.5vw,15px)] text-muted">This is to certify that</p>
          <p className="my-[1.5%] text-[clamp(24px,5.4vw,58px)] font-bold leading-tight tracking-tight">{c.holder_name}</p>
          <p className="text-[clamp(10px,1.5vw,15px)] text-muted">has successfully completed</p>
          <p className="mt-1 text-[clamp(14px,2.4vw,26px)] font-semibold text-evol">{c.course}</p>
          <p className="mt-[1.5%] text-[clamp(9px,1.3vw,13px)] text-muted">a live online course by Evol, with at least 50% attendance and an accepted course project.</p>
        </div>
        <div className="relative flex w-full items-end justify-between px-[3%] text-left">
          <div className="text-[clamp(9px,1.3vw,13px)]"><p className="text-muted">Issued on</p><p className="font-semibold">{date}</p></div>
          <div className="text-center"><p className="font-mono text-[clamp(9px,1.3vw,13px)] font-bold tracking-wider">{certId}</p><p className="text-[clamp(8px,1vw,10px)] text-muted">Verify at {site.replace("https://", "")}/verify</p></div>
          <div className="h-[clamp(48px,9vw,90px)] w-[clamp(48px,9vw,90px)]" aria-label="QR code to verify this certificate" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
      </section>
    </main>
  );
}
