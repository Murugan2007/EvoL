import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Logo size={44} />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Welcome in.</h1>
      <p className="mt-2 mb-8 text-muted">Sign in to join the batch, see your classes and collect your certificate.</p>
      <LoginForm next={safeNext} />
    </main>
  );
}
