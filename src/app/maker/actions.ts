"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMaker } from "@/lib/auth";

export async function deleteProduct(formData: FormData) {
  await requireMaker();
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", String(formData.get("id"))); // RLS: own only
  revalidatePath("/maker");
}

export async function setHidden(formData: FormData) {
  await requireMaker();
  const supabase = await createClient();
  const hide = formData.get("hide") === "1";
  // hide → 'hidden'; show again → back to 'pending' so it is re-checked
  await supabase.from("products").update({ status: hide ? "hidden" : "pending" }).eq("id", String(formData.get("id")));
  revalidatePath("/maker");
}

export async function sendOffer(formData: FormData) {
  const me = await requireMaker();
  const supabase = await createClient();
  const { error } = await supabase.from("offers").insert({
    request_id: String(formData.get("request_id")),
    maker_id: me.id,
    message: String(formData.get("message")).trim(),
    price_inr: Math.round(Number(formData.get("price"))),
  });
  revalidatePath("/maker/requests");
  if (error) redirect("/maker/requests?error=" + encodeURIComponent("Offer needs a message (10+ chars) and a price."));
}
