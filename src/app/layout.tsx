import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "./globals.css";
import { Splash } from "@/components/Splash";

export const metadata: Metadata = {
  title: { default: "Evol — Make every possibility a reality", template: "%s · Evol" },
  description: "Learn electronics, build real things, and get them made. A student-run maker platform.",
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* If the intro was already seen this session, hide it before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('evol_splash_seen'))document.documentElement.classList.add('no-splash')}catch(e){}" }} />
      </head>
      <body className="min-h-dvh">
        <Splash />
        {children}
      </body>
    </html>
  );
}
