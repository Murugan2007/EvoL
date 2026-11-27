import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?next=/register");
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("batches").select("id,name,course_title,price_inr,registration_open")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!batch || !batch.registration_open) {
    return <main className="mx-auto max-w-md px-5 py-10"><p>Registration isn&apos;t open right now.</p><Link href="/" className="text-evol">‹ Back</Link></main>;
  }
  const { data: existing } = await supabase.from("registrations").select("id").eq("batch_id", batch.id).maybeSingle();
  if (existing) redirect("/");
  const { data: seats } = await supabase.rpc("seats_left", { p_batch_id: batch.id });
  const { data: profile } = await supabase.from("profiles").select("full_name,phone,college").eq("id", uid).single();

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <Link href="/" className="text-sm text-muted">‹ Back</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Join the {batch.name}</h1>
      <p className="text-sm text-muted">{batch.course_title} · {typeof seats === "number" ? `${Math.max(seats, 0)} seats left` : ""}</p>
      <RegisterForm
        batchId={batch.id}
        userId={uid}
        price={batch.price_inr}
        defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", college: profile?.college ?? "" }}
        upiId={process.env.NEXT_PUBLIC_UPI_ID ?? ""}
      />
    </main>
  );
}
