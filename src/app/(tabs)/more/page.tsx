import Link from "next/link";
import { Icon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { avatarUrl } from "@/lib/certificate";
import { signOut } from "../../actions";

export const metadata = { title: "More" };

function Row({ href, icon, title, external, dark }: { href: string; icon: string; title: string; external?: boolean; dark?: boolean }) {
  const cls = `flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 ${dark ? "bg-space text-white" : ""}`;
  const inner = (<><Icon name={icon} className={`h-5 w-5 ${dark ? "text-white" : "text-evol"}`} /><span className="flex-1 font-semibold">{title}</span><Icon name={external ? "external" : "chevron"} className="h-4 w-4 text-muted" /></>);
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

export default async function MorePage() {
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: reg } = profile
    ? await supabase.from("registrations").select("id,code,batch_id").eq("user_id", profile.id).eq("status", "approved").maybeSingle()
    : { data: null };
  const [{ count: total }, { data: att }] = reg
    ? await Promise.all([
        supabase.from("classes").select("*", { count: "exact", head: true }).eq("batch_id", reg.batch_id),
        supabase.from("attendance").select("attended").eq("registration_id", reg.id),
      ])
    : [{ count: 0 }, { data: null }];
  const done = (att ?? []).filter((a) => a.attended).length;
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const name = profile?.full_name || "Evol member";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="px-5 pt-6"><h1 className="text-[28px] font-bold leading-none tracking-tight">More</h1></header>

      <section className="space-y-3 px-5 pt-4">
        {profile ? (
          <Link href="/profile" className="flex items-center gap-4 rounded-[22px] border border-line bg-white p-4 shadow-sm">
            {avatarUrl(profile.avatar_path)
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl(profile.avatar_path)!} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4a4a] to-[#c81f26] text-2xl font-bold text-white">{initials || "E"}</span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold leading-tight">{name}</p>
              <p className="truncate text-sm text-muted">{reg ? `Founding batch · ${reg.code}` : profile.email}</p>
              <p className="text-xs font-semibold text-evol">Edit profile ›</p>
            </div>
          </Link>
        ) : (
          <Link href="/login" className="btn w-full">Sign in</Link>
        )}

        {reg && (
          <div className="rounded-[22px] bg-maroon p-4 text-white">
            <div className="flex items-baseline justify-between"><p className="text-lg font-bold">Batch progress</p><p className="text-sm text-white/70">{done} of {total} classes</p></div>
            <div className="mt-2 h-2 rounded-full bg-white/25"><div className="h-2 rounded-full bg-white" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-sm text-white/85">Attend at least 50% of classes and finish the mini project to get your certificate.</p>
          </div>
        )}

        <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-sm">
          {profile?.role === "admin" && <Row href="/admin" icon="admin" title="Admin menu" dark />}
          {profile && profile.role !== "learner" && <Row href="/maker" icon="tool" title="Maker studio" />}
          <Row href="/profile#certificates" icon="award" title="My certificates" />
          <Row href="/verify" icon="shield" title="Verify a certificate" />
          <Row href="/request" icon="chat" title="My requests" />
          {profile?.role === "learner" && <Row href="/become-a-maker" icon="tool" title="Become a maker" />}
          <Row href="/about" icon="help" title="About Evol" />
          <Row href="/terms" icon="doc" title="Terms and refund policy" />
          <Row href="/privacy" icon="lock" title="Privacy policy" />
          <Row href="https://www.linkedin.com/company/evolindia" icon="external" title="Follow Evol on LinkedIn" external />
        </div>

        {profile && <form action={signOut}><button className="btn-ghost w-full">Sign out</button></form>}
      </section>
    </>
  );
}
