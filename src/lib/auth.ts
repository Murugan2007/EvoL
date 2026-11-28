import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_path: string | null;
  role: "learner" | "maker" | "admin";
};

/**
 * Who is signed in? Uses getClaims(): the token is verified locally (no network call to Supabase
 * on projects with asymmetric JWT keys), and cache() shares the result for the whole request.
 */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const id = await getUserId();
  if (!id) return null;
  const supabase = await createClient();
  const full = await supabase.from("profiles").select("id,email,full_name,avatar_path,role").eq("id", id).maybeSingle();
  if (full.data) return full.data as Profile;
  // Database not fully migrated yet (avatar_path column missing)? Don't lock people out: read without it.
  const basic = await supabase.from("profiles").select("id,email,full_name,role").eq("id", id).maybeSingle();
  return basic.data ? ({ ...basic.data, avatar_path: null } as Profile) : null;
});

/** Server-side gate for every admin page. (Data is ALSO protected by RLS.) */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect((await getUserId()) ? "/" : "/login?next=/admin"); // signed in but no profile row: avoid a login<->admin loop
  if (profile.role !== "admin") redirect("/");
  return profile;
}

/** Makers (and admins) only. */
export async function requireMaker(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect((await getUserId()) ? "/" : "/login?next=/maker");
  if (profile.role === "learner") redirect("/become-a-maker");
  return profile;
}
