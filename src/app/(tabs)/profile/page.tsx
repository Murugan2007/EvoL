import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserId } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect((await getUserId()) ? "/" : "/login?next=/profile");
  const supabase = await createClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select("cert_id,issued_at,revoked,holder_name,registrations!inner(user_id,batches(course_title))")
    .eq("registrations.user_id", profile.id)
    .order("issued_at", { ascending: false });

  return (
    <>
      <header className="px-5 pt-6">
        <Link href="/more" className="text-sm font-semibold text-evol">‹ More</Link>
        <h1 className="mt-1 text-[28px] font-bold leading-none tracking-tight">My profile</h1>
      </header>
      <section className="space-y-5 px-5 pt-4">
        <ProfileForm userId={profile.id} initialName={profile.full_name ?? ""} initialAvatar={profile.avatar_path} email={profile.email} />

        <div id="certificates" className="scroll-mt-4 space-y-3">
          <h2 className="text-lg font-bold">My certificates</h2>
          {(certs ?? []).length === 0 && (
            <div className="card text-sm text-muted">No certificates yet. Attend at least 50% of classes and get your mini project accepted, and your certificate will appear here.</div>
          )}
          {(certs ?? []).map((c) => {
            const reg = Array.isArray(c.registrations) ? c.registrations[0] : c.registrations;
            const b = Array.isArray(reg?.batches) ? reg?.batches[0] : reg?.batches;
            return (
              <div key={c.cert_id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">🎓 {b?.course_title ?? "Evol course"}</p>
                    <p className="text-sm text-muted">{c.holder_name} · {new Date(c.issued_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
                    <p className="mt-0.5 font-mono text-sm">{c.cert_id}</p>
                  </div>
                  <span className={`chip ${c.revoked ? "bg-red-100 text-evol" : "bg-green-100 text-green-800"}`}>{c.revoked ? "Revoked" : "Valid"}</span>
                </div>
                {!c.revoked && (
                  <div className="mt-3 flex gap-2">
                    <Link href={`/certificate/${c.cert_id}`} className="btn btn-sm flex-1">View / download</Link>
                    <Link href={`/verify/${c.cert_id}`} className="btn-ghost btn-sm flex-1">Verification page</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
