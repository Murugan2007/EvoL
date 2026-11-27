import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = await createClient();
  const count = async (table: string, col?: string, val?: string) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (col && val) q = q.eq(col, val);
    return (await q).count ?? 0;
  };
  const [pending, approved, toReview, certs, makerApps, productsPending] = await Promise.all([
    count("registrations", "status", "pending"),
    count("registrations", "status", "approved"),
    count("submissions", "status", "submitted"),
    count("certificates"),
    count("maker_applications", "status", "pending"),
    count("products", "status", "pending"),
  ]);
  const { data: batch } = await supabase.from("batches").select("seats,name").order("created_at", { ascending: false }).limit(1).maybeSingle();

  const stats = [
    { label: "Payments to review", value: pending, hot: pending > 0 },
    { label: "Learners approved", value: batch ? `${approved} / ${batch.seats}` : approved },
    { label: "Projects to review", value: toReview },
    { label: "Certificates issued", value: certs },
    { label: "Maker applications", value: makerApps, hot: makerApps > 0 },
    { label: "Products to review", value: productsPending, hot: productsPending > 0 },
  ];

  const menu = [
    { href: "/admin/payments", title: "Payments", sub: "Approve or reject registrations, spot duplicate UTRs, generate codes", live: true },
    { href: "/admin/batches", title: "Batches & seats", sub: "Create a batch, set seats, price, dates, open/close registration", live: true },
    { href: "/admin/makers", title: "Makers", sub: "Approve or reject maker applications", live: true },
    { href: "/admin/products", title: "Products", sub: "Review products before they go live in the marketplace", live: true },
    { href: "/admin/learners", title: "Learners", sub: "Approved learners with their unique codes", live: true },
    { title: "Classes & attendance", sub: "Schedule, join links, 50% attendance tracking", live: false },
    { title: "Project reviews", sub: "Accept submissions or ask for changes", live: false },
    { title: "Certificates", sub: "Issue, view and revoke certificates", live: false },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className={`text-3xl font-bold ${s.hot ? "text-evol" : ""}`}>{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Admin menu</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menu.map((m) =>
            m.live ? (
              <Link key={m.title} href={m.href!} className="card transition hover:border-evol/40">
                <p className="font-semibold">{m.title} <span className="text-evol">›</span></p>
                <p className="mt-1 text-sm text-muted">{m.sub}</p>
              </Link>
            ) : (
              <div key={m.title} className="card opacity-60">
                <p className="font-semibold">{m.title} <span className="chip ml-1 bg-line text-muted">Next</span></p>
                <p className="mt-1 text-sm text-muted">{m.sub}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
