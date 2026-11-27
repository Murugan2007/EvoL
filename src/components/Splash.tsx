"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "evol_splash_seen";

/**
 * Opening animation. Plays once per browser session, then fades out.
 * Skipped for reduced-motion users. Always has a safety timeout so it can never trap the app.
 */
export function Splash() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const finish = () => {
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      setFading(true);
      setTimeout(() => setGone(true), 450);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();

    const v = ref.current;
    v?.play().catch(finish); // autoplay blocked → just continue
    const safety = setTimeout(finish, 6500);
    v?.addEventListener("ended", finish);
    return () => { clearTimeout(safety); v?.removeEventListener("ended", finish); };
  }, []);

  if (gone) return null;
  return (
    <div
      id="splash"
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#fe2a29] transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <video ref={ref} muted playsInline preload="auto" className="w-full max-w-[520px]">
        <source src="/evol-intro.mp4" type="video/mp4" />
        <source src="/evol-intro.webm" type="video/webm" />
      </video>
    </div>
  );
}
