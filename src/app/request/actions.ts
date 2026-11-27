"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/request");
  const budget = Number(formData.get("budget"));
  const { error } = await supabase.from("requests").insert({
    user_id: user.id,
    title: String(formData.get("title")).trim(),
    description: String(formData.get("description")).trim(),
    budget_inr: budget > 0 ? Math.round(budget) : null,
  });
  revalidatePath("/request");
  redirect(error ? `/request?error=${encodeURIComponent("Please check the title (5+ chars) and description (20+ chars).")}` : "/request");
}

export async function closeRequest(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("requests").update({ status: "closed" }).eq("id", String(formData.get("id")));
  revalidatePath("/request");
}
