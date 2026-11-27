"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/request");
  const budget = Number(formData.get("budget"));
  const text = String(formData.get("description") ?? "").trim();
  const kind = ["fix", "improve", "invent"].includes(String(formData.get("kind"))) ? String(formData.get("kind")) : "invent";
  const needBy = String(formData.get("need_by") ?? "");
  const { error } = await supabase.from("requests").insert({
    user_id: user.id,
    title: text.replace(/\s+/g, " ").slice(0, 80),
    description: text,
    kind,
    need_by: /^\d{4}-\d{2}-\d{2}$/.test(needBy) ? needBy : null,
    budget_inr: budget > 0 ? Math.round(budget) : null,
  });
  revalidatePath("/request");
  redirect(error ? `/request?error=${encodeURIComponent("Please describe what you need in a bit more detail (20+ characters).")}` : "/request");
}

export async function closeRequest(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("requests").update({ status: "closed" }).eq("id", String(formData.get("id")));
  revalidatePath("/request");
}
