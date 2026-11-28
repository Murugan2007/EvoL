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

export async function approveMaker(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_maker", { p_id: String(formData.get("id")) });
  revalidatePath("/admin", "layout");
  back("/admin/makers", error?.message);
}

export async function rejectMaker(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const reason = String(formData.get("reason") ?? "").trim() || "We couldn't approve this application yet.";
  const { error } = await supabase.rpc("reject_maker", { p_id: String(formData.get("id")), p_reason: reason.slice(0, 300) });
  revalidatePath("/admin", "layout");
  back("/admin/makers", error?.message);
}

export async function reviewProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_product", { p_id: String(formData.get("id")), p_status: String(formData.get("status")) });
  revalidatePath("/admin", "layout");
  back("/admin/products", error?.message);
}

// ── classes & attendance ───────────────────────────────────────
export async function saveClass(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const when = String(formData.get("starts_at") ?? "");
  const row = {
    batch_id: String(formData.get("batch_id")),
    day_no: Number(formData.get("day_no")),
    title: String(formData.get("title")).trim(),
    // the form sends India time; store as an exact instant
    starts_at: when ? new Date(`${when}:00+05:30`).toISOString() : null,
    join_link: String(formData.get("join_link") ?? "").trim() || null,
  };
  const { error } = await supabase.from("classes").upsert(row, { onConflict: "batch_id,day_no" });
  revalidatePath("/admin/classes");
  back("/admin/classes", error?.message);
}

export async function deleteClass(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/classes");
  back("/admin/classes", error?.message);
}

/** Mark attendance from checkboxes (all approved learners listed; ticked = present). */
export async function saveAttendance(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const classId = String(formData.get("class_id"));
  const all = formData.getAll("all").map(String);
  const present = new Set(formData.getAll("present").map(String));
  const rows = all.map((rid) => ({ class_id: classId, registration_id: rid, attended: present.has(rid) }));
  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "class_id,registration_id" });
  revalidatePath("/admin/attendance");
  back(`/admin/attendance?class=${classId}`, error?.message);
}

/** Paste the meeting's participant list; every learner code found (EVxxxx) is marked present. */
export async function importAttendance(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const classId = String(formData.get("class_id"));
  const text = String(formData.get("report") ?? "").toUpperCase();
  const codes = [...new Set(text.match(/\bEV[A-HJ-NP-Z2-9]{4}\b/g) ?? [])];
  if (codes.length === 0) back(`/admin/attendance?class=${classId}`, "No learner codes (like EV7K3Q) found in that text.");
  const { data: regs } = await supabase.from("registrations").select("id,code").in("code", codes).eq("status", "approved");
  const rows = (regs ?? []).map((r) => ({ class_id: classId, registration_id: r.id, attended: true }));
  const { error } = rows.length ? await supabase.from("attendance").upsert(rows, { onConflict: "class_id,registration_id" }) : { error: null };
  revalidatePath("/admin/attendance");
  back(`/admin/attendance?class=${classId}&done=${rows.length}of${codes.length}`, error?.message);
}

// ── project reviews ────────────────────────────────────────────
export async function reviewSubmission(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const status = String(formData.get("status"));
  if (!["accepted", "needs_work"].includes(status)) back("/admin/submissions", "Bad status");
  const { error } = await supabase.from("submissions").update({ status }).eq("id", String(formData.get("id")));
  revalidatePath("/admin", "layout");
  back("/admin/submissions", error?.message);
}

// ── certificates ───────────────────────────────────────────────
export async function issueCertificate(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_certificate", { p_registration_id: String(formData.get("id")) });
  revalidatePath("/admin", "layout");
  back("/admin/certificates", error?.message);
}

export async function revokeCertificate(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_certificate", { p_cert_id: String(formData.get("cert_id")), p_reason: String(formData.get("reason") ?? "").trim() || "Revoked by admin" });
  revalidatePath("/admin", "layout");
  back("/admin/certificates", error?.message);
}
