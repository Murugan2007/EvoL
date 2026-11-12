"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function submitProject(formData: FormData) {
  const supabase = await createClient();
  const regId = String(formData.get("registration_id"));
  const link = String(formData.get("link") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!/^https?:\/\//i.test(link)) return;
  // RLS decides whether this learner is allowed; we just try.
  await supabase
    .from("submissions")
    .upsert({ registration_id: regId, link, note, status: "submitted" }, { onConflict: "registration_id" });
  revalidatePath("/");
}

export async function resubmitRegistration(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("registrations").delete().eq("id", String(formData.get("id"))); // RLS: own + rejected only
  redirect("/register");
}
