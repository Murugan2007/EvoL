import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { resubmitRegistration, submitProject } from "../actions";

const topics = [
  { label: "Basics", icon: "bolt" }, { label: "IoT", icon: "chip" }, { label: "Projects", icon: "tool" },
  { label: "Certificates", icon: "award", href: "/verify" }, { label: "Shop", icon: "bag", href: "/market" },
];

export default async function LearnPage() {
  const supabase = await createClient();
  const [profile, { data: batch }] = await Promise.all([
    getProfile(),
    supabase.from("batches").select("id,name,course_title,price_inr,seats,starts_on,project_due_on,registration_open")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const [{ data: seats }, { data: reg }] = await Promise.all([
    batch ? supabase.rpc("seats_left", { p_batch_id: batch.id }) : Promise.resolve({ data: null }),
    profile && batch
      ? supabase.from("registrations").select("*").eq("user_id", profile.id).eq("batch_id", batch.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const approved = reg?.status === "approved";
  const [{ data: classes }, { data: attendance }, { data: submission }, { data: cert }] = approved
    ? await Promise.all([
        supabase.from("classes").select("id,day_no,title,starts_at,join_link").eq("batch_id", batch!.id).order("day_no"),
        supabase.from("attendance").select("class_id,attended").eq("registration_id", reg!.id),
        supabase.from("submissions").select("link,status,note").eq("registration_id", reg!.id).maybeSingle(),
        supabase.from("certificates").select("cert_id,revoked").eq("registration_id", reg!.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];

  const total = classes?.length ?? 6;
  const present = (attendance ?? []).filter((a) => a.attended).length;
  const first = (reg?.full_name ?? profile?.full_name)?.split(" ")[0];
  const now = new Date().getTime();
  const dayNo = batch?.starts_on
    ? Math.min(Math.max(Math.floor((now - new Date(batch.starts_on).getTime()) / 86400000) + 1, 1), total)
    : null;
  const next = (classes ?? []).find((c) => !c.starts_at || new Date(c.starts_at).getTime() > now - 2 * 3600e3) ?? classes?.[classes.length - 1];

  const title = approved ? (dayNo ? `Day ${dayNo} of ${total}` : `Hi ${first}`) : "Learn";
  const tile = "flex min-h-[72px] flex-col justify-between rounded-2xl bg-white p-3 text-left text-[13px] font-semibold leading-tight text-ink";

  return (
    <>
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div className="flex items-start gap-3">
          <Logo size={38} />
          <div>
            <h1 className="text-[26px] font-bold leading-none tracking-tight">{title}</h1>
            <p className="mt-1 text-xs leading-snug text-muted">{batch?.name ?? "Evol"} · Live online</p>
          </div>
        </div>
        {approved ? (
          <div className="rounded-2xl border border-line bg-white px-3 py-1.5 text-right shadow-sm">
            <p className="text-[10px] text-muted">Your code</p>
            <p className="font-mono text-sm font-bold tracking-wider text-evol">{reg.code}</p>
          </div>
        ) : !profile ? (
          <Link href="/login" className="mt-1 text-sm font-semibold text-evol">Sign in</Link>
        ) : profile.role === "admin" ? (
          <Link href="/admin" className="chip mt-1 bg-space text-white">Admin ›</Link>
        ) : null}
      </header>

      <form action="/market" className="relative mx-5 mt-5">
        <input name="q" className="input rounded-2xl py-3 pr-11" placeholder="Search courses, makers, projects…" />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink" aria-label="Search"><Icon name="search" className="h-[18px] w-[18px]" /></button>
      </form>

      {batch && (
        <section className="mx-5 mt-4 rounded-[26px] bg-maroon p-4 text-white shadow-[0_10px_30px_-12px_rgba(122,21,25,.6)]">
          <h2 className="text-lg font-bold leading-tight">{approved ? "Your founding batch" : batch.course_title}</h2>
          <p className="text-xs text-white/70">
            6 days · live online · {batch.seats} seats{!approved && typeof seats === "number" ? ` · ${Math.max(seats, 0)} left` : ""}
          </p>
          {approved ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <a href={next?.join_link ?? "#classes"} {...(next?.join_link ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={tile}>Today&apos;s class<Icon name="play" className="h-5 w-5 self-end text-evol" /></a>
              <div className={`${tile} opacity-70`}>Placement cheat sheet<span className="flex items-center justify-between text-[10px] font-medium text-muted">Soon<Icon name="doc" className="h-5 w-5 text-evol" /></span></div>
              <a href="#project" className={tile}>Mini project<Icon name="flag" className="h-5 w-5 self-end text-evol" /></a>
              <a href="#certificate" className={tile}>Certificate<Icon name="award" className="h-5 w-5 self-end text-evol" /></a>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm"><b className="text-2xl">₹{batch.price_inr}</b> <span className="text-white/60">founding price</span></p>
              {batch.registration_open && !reg && <Link href="/register" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-evol">Register</Link>}
            </div>
          )}
        </section>
      )}

      <nav className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
        {topics.map((t) => {
          const body = (<><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fde3e3] text-evol"><Icon name={t.icon} className="h-6 w-6" /></span><span className="text-xs font-medium">{t.label}</span></>);
          return t.href
            ? <Link key={t.label} href={t.href} className="flex shrink-0 flex-col items-center gap-1.5">{body}</Link>
            : <span key={t.label} className="flex shrink-0 flex-col items-center gap-1.5">{body}</span>;
        })}
      </nav>

      <section className="space-y-4 px-5 pt-5">
        {approved && next && (
          <div>
            <h3 className="mb-2 text-lg font-bold tracking-tight">{first}, continue learning</h3>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-evol text-xl font-bold text-white">{next.day_no}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">Day {next.day_no} · {next.title}</p>
                <p className="truncate text-xs text-muted">Join as {reg.code} - {first}</p>
              </div>
              {next.join_link && <a href={next.join_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Join</a>}
            </div>
          </div>
        )}

        {profile && !reg && batch?.registration_open && <Link href="/register" className="btn w-full">Register for ₹{batch.price_inr}</Link>}

        {reg?.status === "pending" && (
          <div className="card"><span className="chip bg-amber-100 text-amber-800">Under review</span>
            <p className="mt-2 text-sm text-muted">We&apos;re checking your payment (UTR <b className="text-ink">{reg.utr}</b>). Your code will appear here once approved.</p></div>
        )}
        {reg?.status === "rejected" && (
          <div className="card"><span className="chip bg-red-100 text-evol">Needs a fix</span>
            <p className="mt-2 text-sm">{reg.reject_reason || "We couldn't verify this payment."}</p>
            <form action={resubmitRegistration} className="mt-3"><input type="hidden" name="id" value={reg.id} /><button className="btn btn-sm">Submit again</button></form></div>
        )}

        {approved && (
          <>
            <div id="classes" className="scroll-mt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-lg font-bold tracking-tight">Classes</h3>
                <span className="text-xs text-muted">Attended {present}/{total} · need {Math.ceil(total / 2)}</span>
              </div>
              <ul className="space-y-2">
                {(classes ?? []).length === 0 && <li className="card text-sm text-muted">Schedule will appear here soon.</li>}
                {(classes ?? []).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3">
                    <div>
                      <p className="text-xs font-semibold text-evol">Day {c.day_no}</p>
                      <p className="font-medium leading-tight">{c.title}</p>
                      {c.starts_at && <p className="text-xs text-muted">{new Date(c.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>}
                    </div>
                    {c.join_link && <a href={c.join_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Join</a>}
                  </li>
                ))}
              </ul>
            </div>

            <div id="project" className="card scroll-mt-4">
              <h3 className="font-bold">Mini project</h3>
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

            <div id="certificate" className="card scroll-mt-4">
              {cert ? (
                <>
                  <p className="font-bold">🎓 Your certificate is ready</p>
                  <p className="mt-1 font-mono text-sm">{cert.cert_id}</p>
                  <Link href={`/verify/${cert.cert_id}`} className="mt-2 inline-block text-sm font-semibold text-evol">View / share verification page ›</Link>
                </>
              ) : (
                <><p className="font-bold">Certificate</p><p className="mt-1 text-sm text-muted">Attend at least 50% of classes and get your mini project accepted. Your certificate appears here.</p></>
              )}
            </div>
          </>
        )}

        {!batch && <p className="card text-sm text-muted">No batch is open right now. Check back soon.</p>}
        {batch && !batch.registration_open && !reg && <p className="card text-sm text-muted">Registration for this batch is closed.</p>}
      </section>
    </>
  );
}
