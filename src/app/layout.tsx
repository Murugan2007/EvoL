import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Evol — Make every possibility a reality", template: "%s · Evol" },
  description: "Learn electronics, build real things, and get them made. A student-run maker platform.",
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
