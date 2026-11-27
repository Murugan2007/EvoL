import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Become a maker" };

async function apply(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/become-a-maker");
  const portfolio = String(formData.get("portfolio") ?? "").trim();
  const { error } = await supabase.from("maker_applications").insert({
    user_id: user.id,
    display_name: String(formData.get("name")).trim(),
    bio: String(formData.get("bio")).trim(),
    portfolio_url: portfolio || null,
  });
  revalidatePath("/become-a-maker");
  if (error) redirect("/become-a-maker?error=1");
}

async function retry(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("maker_applications").delete().eq("id", String(formData.get("id")));
  revalidatePath("/become-a-maker");
}

export default async function BecomeMakerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const profile = await getProfile();
  if (profile && profile.role !== "learner") redirect("/maker");
  const supabase = await createClient();
  const { data: app } = profile
    ? await supabase.from("maker_applications").select("*").eq("user_id", profile.id).maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <Link href="/more" className="text-sm text-muted">‹ Back</Link>
      <div className="mt-4"><Logo /></div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Sell what you build</h1>
      <p className="mt-1 text-sm text-muted">List gadgets and projects, and answer customer requests. We review every maker before they go live.</p>

      {!profile && <Link href="/login?next=/become-a-maker" className="btn mt-6 w-full">Sign in to apply</Link>}

      {app?.status === "pending" && <div className="card mt-6"><span className="chip bg-amber-100 text-amber-800">Under review</span><p className="mt-2 text-sm text-muted">Thanks, {app.display_name}! We&apos;ll approve you soon. Check back here.</p></div>}
      {app?.status === "rejected" && (
        <div className="card mt-6">
          <span className="chip bg-red-100 text-evol">Not approved</span>
          <p className="mt-2 text-sm">{app.reject_reason || "We couldn't approve this application."}</p>
          <form action={retry} className="mt-3"><input type="hidden" name="id" value={app.id} /><button className="btn btn-sm">Apply again</button></form>
        </div>
      )}

      {profile && !app && (
        <form action={apply} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="name">Maker / shop name</label><input id="name" name="name" className="input" required minLength={2} maxLength={60} /></div>
          <div><label className="label" htmlFor="bio">What do you build?</label><textarea id="bio" name="bio" className="input min-h-28" required minLength={10} maxLength={600} placeholder="Tell us about your projects and skills" /></div>
          <div><label className="label" htmlFor="portfolio">Link to your work <span className="text-muted">(optional)</span></label><input id="portfolio" name="portfolio" type="url" className="input" placeholder="GitHub, Instagram, YouTube…" /></div>
          {error && <p className="text-sm text-evol" role="alert">Please check your details and try again.</p>}
          <button className="btn w-full">Submit application</button>
        </form>
      )}
    </main>
  );
}
