import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { resubmitRegistration, submitProject } from "./actions";

export default async function LearnPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: batch } = await supabase
    .from("batches").select("id,name,course_title,price_inr,seats,starts_on,project_due_on,registration_open")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: seats } = batch ? await supabase.rpc("seats_left", { p_batch_id: batch.id }) : { data: null };

  const { data: reg } = profile && batch
    ? await supabase.from("registrations").select("*").eq("user_id", profile.id).eq("batch_id", batch.id).maybeSingle()
    : { data: null };

  const approved = reg?.status === "approved";
  const [{ data: classes }, { data: attendance }, { data: submission }, { data: cert }] = approved
    ? await Promise.all([
        supabase.from("classes").select("id,day_no,title,starts_at,join_link").eq("batch_id", batch!.id).order("day_no"),
        supabase.from("attendance").select("class_id,attended").eq("registration_id", reg!.id),
        supabase.from("submissions").select("link,status,note").eq("registration_id", reg!.id).maybeSingle(),
        supabase.from("certificates").select("cert_id,revoked").eq("registration_id", reg!.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];

  const present = (attendance ?? []).filter((a) => a.attended).length;
  const total = classes?.length ?? 0;
  const first = profile?.full_name?.split(" ")[0];

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
        {profile?.role === "admin" ? (
          <Link href="/admin" className="chip bg-space text-white">Admin ›</Link>
        ) : !profile ? (
          <Link href="/login" className="text-sm font-semibold text-evol">Sign in</Link>
        ) : null}
      </header>

      <section className="px-5 pt-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">
          {first ? `Hi ${first}, ` : ""}ready to build something?
        </h1>
      </section>

      {batch && (
        <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-maroon to-space p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{batch.name}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{batch.course_title}</h2>
          <p className="mt-1 text-sm text-white/75">6 days · online · certificate of completion from Evol</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm"><b className="text-2xl">₹{batch.price_inr}</b> <span className="text-white/60">founding price</span></p>
            {typeof seats === "number" && <span className="chip bg-white/15 text-white">{Math.max(seats, 0)} seats left</span>}
          </div>
        </section>
      )}

      <section className="space-y-4 px-5 pt-5">
        {!profile && batch?.registration_open && (
          <Link href="/register" className="btn w-full">Register for ₹{batch.price_inr}</Link>
        )}

        {profile && !reg && batch?.registration_open && (
          <Link href="/register" className="btn w-full">Register for ₹{batch.price_inr}</Link>
        )}

        {reg?.status === "pending" && (
          <div className="card">
            <span className="chip bg-amber-100 text-amber-800">Under review</span>
            <p className="mt-2 text-sm text-muted">We&apos;re checking your payment (UTR <b className="text-ink">{reg.utr}</b>). You&apos;ll see your code here once it&apos;s approved.</p>
          </div>
        )}

        {reg?.status === "rejected" && (
          <div className="card">
            <span className="chip bg-red-100 text-evol">Needs a fix</span>
            <p className="mt-2 text-sm">{reg.reject_reason || "We couldn't verify this payment."}</p>
            <form action={resubmitRegistration} className="mt-3">
              <input type="hidden" name="id" value={reg.id} />
              <button className="btn btn-sm">Submit again</button>
            </form>
          </div>
        )}

        {approved && (
          <>
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Your code — rename yourself to</p>
                <p className="mt-0.5 text-lg font-bold">{reg.code} - {reg.full_name.split(" ")[0]}</p>
              </div>
              <span className="rounded-lg bg-tint px-3 py-2 font-mono text-lg font-bold tracking-widest text-evol">{reg.code}</span>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="font-semibold">Classes</h3>
                {total > 0 && <span className="text-xs text-muted">Attended {present}/{total} · need {Math.ceil(total / 2)}</span>}
              </div>
              <ul className="space-y-2">
                {(classes ?? []).length === 0 && <li className="card text-sm text-muted">Schedule will appear here soon.</li>}
                {(classes ?? []).map((c) => (
                  <li key={c.id} className="card flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-evol">Day {c.day_no}</p>
                      <p className="font-medium">{c.title}</p>
                      {c.starts_at && <p className="text-xs text-muted">{new Date(c.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>}
                    </div>
                    {c.join_link && <a href={c.join_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Join</a>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold">Course project</h3>
              {batch?.project_due_on && <p className="text-xs text-muted">Due {batch.project_due_on}</p>}
              {submission && <p className="mt-2 text-sm">Status: <b>{submission.status.replace("_", " ")}</b></p>}
              {submission?.status !== "accepted" && (
                <form action={submitProject} className="mt-3 space-y-2">
                  <input type="hidden" name="registration_id" value={reg.id} />
                  <input className="input" name="link" type="url" required placeholder="Link to your project (GitHub, Drive, video…)" defaultValue={submission?.link} />
                  <input className="input" name="note" maxLength={500} placeholder="Anything we should know? (optional)" defaultValue={submission?.note ?? ""} />
                  <button className="btn btn-sm">{submission ? "Update submission" : "Submit project"}</button>
                </form>
              )}
            </div>

            {cert && (
              <div className="card border-evol/30 bg-tint">
                <p className="text-sm font-semibold">🎓 Your certificate is ready</p>
                <p className="mt-1 font-mono text-sm">{cert.cert_id}</p>
                <Link href={`/verify/${cert.cert_id}`} className="mt-2 inline-block text-sm font-semibold text-evol">View / share verification page ›</Link>
              </div>
            )}
          </>
        )}

        {!batch && <p className="card text-sm text-muted">No batch is open right now. Check back soon.</p>}
        {batch && !batch.registration_open && !reg && <p className="card text-sm text-muted">Registration for this batch is closed.</p>}
      </section>
    </AppShell>
  );
}
