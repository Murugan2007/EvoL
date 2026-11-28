"use client";

import { useEffect, useRef, useState } from "react";
import { drawCertificate, loadImage, templateUrl, type CertTemplate } from "@/lib/certificate";

export function CertificateCanvas({ template, name, certId, qrDataUrl }: { template: CertTemplate; name: string; certId: string; qrDataUrl: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [note, setNote] = useState("");

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [img, qr] = await Promise.all([loadImage(templateUrl(template.image_path)), loadImage(qrDataUrl)]);
        if (off || !ref.current) return;
        await drawCertificate(ref.current, img, template, name, qr, certId);
        if (!off) setState("ready");
      } catch { if (!off) setState("error"); }
    })();
    return () => { off = true; };
  }, [template, name, certId, qrDataUrl]);

  function download() {
    ref.current?.toBlob((blob) => {
      if (!blob) return setNote("Couldn't create the image. Use Print / Save as PDF instead.");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Evol-certificate-${certId}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }

  return (
    <div>
      <style>{`@page{margin:0}@media print{.noprint{display:none!important}body{background:#fff!important}.cert-wrap{padding:0!important;max-width:none!important}}`}</style>
      <div className="noprint mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{note || "Download as an image, or print / save as PDF."}</p>
        <div className="flex gap-2">
          <button onClick={download} disabled={state !== "ready"} className="btn btn-sm">Download PNG</button>
          <button onClick={() => window.print()} disabled={state !== "ready"} className="btn-ghost btn-sm">Print / PDF</button>
        </div>
      </div>
      <div className="cert-wrap mx-auto max-w-4xl">
        {state === "loading" && <p className="py-20 text-center text-sm text-muted">Preparing your certificate…</p>}
        {state === "error" && <p className="py-20 text-center text-sm font-medium text-evol">Couldn’t load the certificate image. Refresh to try again.</p>}
        <canvas ref={ref} className={`h-auto w-full rounded-lg bg-white shadow-xl print:rounded-none print:shadow-none ${state === "ready" ? "" : "hidden"}`} aria-label={`Certificate for ${name}`} />
      </div>
    </div>
  );
}
