"use client";

import { useEffect, useRef, useState } from "react";
import { drawCertificate, loadImage, templateUrl, type CertTemplate } from "@/lib/certificate";

export function CertificateCanvas({ template, name, certId, qrDataUrl }: { template: CertTemplate; name: string; certId: string; qrDataUrl: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [note, setNote] = useState("");

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [img, qr] = await Promise.all([loadImage(templateUrl(template.image_path)), loadImage(qrDataUrl)]);
        if (off || !ref.current) return;
        await drawCertificate(ref.current, img, template, name, qr, certId);
        if (!off) setState("ready");
      } catch { if (!off) setState("fallback"); } // canvas path failed: show the plain HTML version instead
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
          <button onClick={download} disabled={state !== "ready"} className={`btn btn-sm ${state === "fallback" ? "hidden" : ""}`}>Download PNG</button>
          <button onClick={() => window.print()} disabled={state === "loading"} className="btn-ghost btn-sm">Print / PDF</button>
        </div>
      </div>
      <div className="cert-wrap mx-auto max-w-4xl">
        {state === "loading" && <p className="py-20 text-center text-sm text-muted">Preparing your certificate…</p>}
        {state === "fallback" && (
          <div className="relative w-full overflow-hidden rounded-lg bg-white shadow-xl print:rounded-none print:shadow-none" style={{ containerType: "inline-size" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={templateUrl(template.image_path)} alt="" className="block h-auto w-full" />
            <span className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden whitespace-nowrap text-center"
              style={{ left: `${template.name_x}%`, top: `${template.name_y}%`, maxWidth: `${template.name_max_w}%`, fontSize: `${template.name_size}cqw`, color: template.name_color, fontWeight: template.name_weight, lineHeight: 1.3 }}>{name}</span>
            {template.show_qr && (
              <span className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center bg-white p-[0.5cqw]"
                style={{ left: `${template.qr_x}%`, top: `${template.qr_y}%`, width: `${template.qr_size}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Verification QR code" className="w-full" />
                <span className="font-semibold text-[#1c1517]" style={{ fontSize: "1cqw" }}>{certId}</span>
              </span>
            )}
          </div>
        )}
        <canvas ref={ref} className={`h-auto w-full rounded-lg bg-white shadow-xl print:rounded-none print:shadow-none ${state === "ready" ? "" : "hidden"}`} aria-label={`Certificate for ${name}`} />
      </div>
    </div>
  );
}
