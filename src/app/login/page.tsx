import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(safeNext);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Logo size={44} />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Welcome in.</h1>
      <p className="mt-2 mb-8 text-muted">Sign in to join the batch, see your classes and collect your certificate.</p>
      <LoginForm next={safeNext} />
      <Link href="/market" className="mt-8 text-center text-sm font-semibold text-muted">Just looking? Browse the marketplace ›</Link>
    </main>
  );
}
