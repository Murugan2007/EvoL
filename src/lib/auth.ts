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
  const { data } = await supabase.from("profiles").select("id,email,full_name,avatar_path,role").eq("id", id).single();
  return (data as Profile) ?? null;
});

/** Server-side gate for every admin page. (Data is ALSO protected by RLS.) */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}

/** Makers (and admins) only. */
export async function requireMaker(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/maker");
  if (profile.role === "learner") redirect("/become-a-maker");
  return profile;
}
