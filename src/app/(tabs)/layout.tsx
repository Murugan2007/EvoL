import { AppShell } from "@/components/AppShell";

// The bottom bar lives here, so it stays put while only the page content changes between tabs.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
