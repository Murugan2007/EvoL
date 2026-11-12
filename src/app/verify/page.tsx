import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Verify a certificate" };

export default function VerifyIndex() {
  async function go(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (id) redirect(`/verify/${id}`);
  }
  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <Logo size={40} />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">Verify a certificate</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Enter the certificate ID printed on it (looks like EVL-AB12-CD34).</p>
      <form action={go} className="space-y-3">
        <input name="id" className="input font-mono uppercase" placeholder="EVL-XXXX-XXXX" required />
        <button className="btn w-full">Check</button>
      </form>
    </main>
  );
}
