import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approveMaker, rejectMaker } from "../actions";

const tabs = ["pending", "approved", "rejected"] as const;

export default async function MakersPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const sp = await searchParams;
  const status = tabs.includes(sp.status as (typeof tabs)[number]) ? sp.status! : "pending";
  const supabase = await createClient();
  const { data } = await supabase.from("maker_applications").select("*").eq("status", status).order("created_at");

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {tabs.map((t) => <Link key={t} href={`/admin/makers?status=${t}`} className={`chip px-4 py-1.5 text-sm capitalize ${t === status ? "bg-evol text-white" : "border border-line bg-white"}`}>{t}</Link>)}
      </div>
      {sp.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-evol" role="alert">{sp.error}</p>}
      {(data ?? []).length === 0 && <p className="card text-sm text-muted">Nothing here.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((a) => (
          <li key={a.id} className="card space-y-3">
            <div><p className="font-semibold">{a.display_name}</p><p className="mt-1 whitespace-pre-line text-sm">{a.bio}</p></div>
            {a.portfolio_url && <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm font-semibold text-evol">{a.portfolio_url}</a>}
            {a.reject_reason && <p className="text-sm text-muted">Reason: {a.reject_reason}</p>}
            {a.status !== "approved" && <form action={approveMaker}><input type="hidden" name="id" value={a.id} /><button className="btn w-full">Approve as maker</button></form>}
            {a.status === "pending" && (
              <form action={rejectMaker} className="flex gap-2"><input type="hidden" name="id" value={a.id} />
                <input name="reason" className="input py-2 text-sm" placeholder="Reason (shown to them)" maxLength={300} />
                <button className="btn-ghost btn-sm shrink-0 text-evol">Reject</button></form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
