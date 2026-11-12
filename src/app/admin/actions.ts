"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function back(path: string, error?: string): never {
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

// Every action re-checks admin on the server AND the database re-checks it again (is_admin()).

export async function approveRegistration(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_registration", { p_id: String(formData.get("id")) });
  revalidatePath("/admin", "layout");
  back("/admin/payments", error?.message);
}

export async function rejectRegistration(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const reason = String(formData.get("reason") ?? "").trim() || "We couldn't verify this payment. Please check the UTR and screenshot and submit again.";
  const { error } = await supabase.rpc("reject_registration", { p_id: String(formData.get("id")), p_reason: reason.slice(0, 300) });
  revalidatePath("/admin", "layout");
  back("/admin/payments", error?.message);
}

export async function createBatch(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("batches").insert({
    name: String(formData.get("name")).trim(),
    course_title: String(formData.get("course_title")).trim(),
    price_inr: Number(formData.get("price_inr")),
    seats: Number(formData.get("seats")),
    starts_on: String(formData.get("starts_on")) || null,
  });
  revalidatePath("/admin", "layout");
  back("/admin/batches", error?.message);
}

export async function updateBatch(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("batches").update({
    seats: Number(formData.get("seats")),
    price_inr: Number(formData.get("price_inr")),
    starts_on: String(formData.get("starts_on")) || null,
    project_due_on: String(formData.get("project_due_on")) || null,
    registration_open: formData.get("registration_open") === "on",
  }).eq("id", String(formData.get("id")));
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  back("/admin/batches", error?.message);
}
