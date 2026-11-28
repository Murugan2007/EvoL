// Certificate templates: shared types + canvas drawing (used by the admin editor AND the certificate page,
// so what the admin sees while placing the name is exactly what learners get).

export type CertTemplate = {
  id: string;
  name: string;
  image_path: string;
  name_x: number;
  name_y: number;
  name_size: number;
  name_max_w: number;
  name_color: string;
  name_weight: number;
  show_qr: boolean;
  qr_x: number;
  qr_y: number;
  qr_size: number;
  is_active: boolean;
};

export const TEMPLATE_COLS =
  "id,name,image_path,name_x,name_y,name_size,name_max_w,name_color,name_weight,show_qr,qr_x,qr_y,qr_size,is_active";

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
export const templateUrl = (path: string) => `${base()}/storage/v1/object/public/certificate-templates/${path}`;
export const avatarUrl = (path: string | null | undefined) =>
  path ? `${base()}/storage/v1/object/public/avatars/${path}` : null;

export function loadImage(src: string, ms = 20000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("image timed out")), ms);
    img.crossOrigin = "anonymous"; // lets the canvas export a PNG
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error("image failed to load")); };
    img.src = src;
  });
}

type Guides = { name?: boolean; qr?: boolean };

export async function drawCertificate(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  t: CertTemplate,
  name: string,
  qr: HTMLImageElement | null,
  certId?: string,
  guides?: Guides,
) {
  const W = img.naturalWidth, H = img.naturalHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // never let a slow/missing font block the certificate: wait at most 2.5 s, then use the fallback font
  try {
    await Promise.race([
      document.fonts.load(`${t.name_weight} 40px "Outfit Variable"`, name || "A"),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to system font */ }
  ctx.drawImage(img, 0, 0, W, H);

  // name: centred on (x, y); long names shrink so they never run outside the box
  let px = (t.name_size / 100) * W;
  const font = (s: number) => `${t.name_weight} ${s}px "Outfit Variable", system-ui, sans-serif`;
  ctx.font = font(px);
  const maxW = (t.name_max_w / 100) * W;
  const w = ctx.measureText(name).width;
  if (w > maxW && w > 0) { px = (px * maxW) / w; ctx.font = font(px); }
  ctx.fillStyle = t.name_color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, (t.name_x / 100) * W, (t.name_y / 100) * H);

  if (t.show_qr && qr) {
    const s = (t.qr_size / 100) * W, cx = (t.qr_x / 100) * W, cy = (t.qr_y / 100) * H, pad = s * 0.06;
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - s / 2 - pad, cy - s / 2 - pad, s + pad * 2, s + pad * 2 + (certId ? s * 0.16 : 0));
    ctx.drawImage(qr, cx - s / 2, cy - s / 2, s, s);
    if (certId) {
      ctx.fillStyle = "#1c1517";
      ctx.font = `600 ${s * 0.11}px "Outfit Variable", system-ui, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(certId, cx, cy + s / 2 + s * 0.13);
    }
  }

  if (guides) {
    const lw = Math.max(2, W / 600);
    ctx.lineWidth = lw;
    ctx.setLineDash([lw * 4, lw * 3]);
    if (guides.name) {
      ctx.strokeStyle = "#d91f26";
      const bw = maxW, bh = (t.name_size / 100) * W * 1.3;
      ctx.strokeRect((t.name_x / 100) * W - bw / 2, (t.name_y / 100) * H - bh / 2, bw, bh);
    }
    if (guides.qr) {
      ctx.strokeStyle = "#1a6bd9";
      const s = (t.qr_size / 100) * W;
      ctx.strokeRect((t.qr_x / 100) * W - s / 2, (t.qr_y / 100) * H - s / 2, s, s);
    }
    ctx.setLineDash([]);
  }
}
