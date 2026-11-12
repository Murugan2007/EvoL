import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const sql = fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");

// --- minimal Supabase stand-ins ---------------------------------------------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant select, insert on storage.objects to authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
await db.exec(sql);

let pass = 0, fail = 0;
const as = async (uid, role, q, params = []) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try { return { ok: true, res: await db.query(q, params) }; }
  catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec(`reset role;`); }
};
const check = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${cond ? "" : extra}`); };

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c";
await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values
  ('${A}','a@x.com','{"full_name":"Asha K"}'),('${B}','admin@x.com','{}'),('${C}','c@x.com','{}')`);
await db.exec(`update public.profiles set role='admin' where id='${B}'`);

check("profile auto-created with name", (await db.query(`select full_name from public.profiles where id='${A}'`)).rows[0]?.full_name === "Asha K");

// self-escalation blocked
let r = await as(A, "authenticated", `update public.profiles set role='admin' where id='${A}'`);
check("learner cannot make themselves admin", !r.ok, JSON.stringify(r));
r = await as(A, "authenticated", `update public.profiles set phone='9876543210' where id='${A}'`);
check("learner can edit own phone", r.ok, r.err);

const batch = (await db.query(`select id from public.batches limit 1`)).rows[0].id;
const ins = (uid, extra = {}) => {
  const v = { status: "pending", path: `${uid}/p.png`, ...extra };
  return `insert into public.registrations (user_id,batch_id,full_name,phone,college,utr,payer_upi_name,screenshot_path,declaration_ok,status)
          values ('${uid}','${batch}','Test User','9876543210','RIT','123456789012','Test','${v.path}',true,'${v.status}')`;
};
r = await as(A, "authenticated", ins(A));
check("learner can register (pending)", r.ok, r.err);
r = await as(C, "authenticated", ins(C, { status: "approved" }));
check("learner cannot self-approve on insert", !r.ok);
r = await as(C, "authenticated", ins(C, { path: `${A}/p.png` }));
check("cannot point at someone else's screenshot folder", !r.ok);
r = await as(C, "authenticated", ins(A));
check("cannot register on behalf of another user", !r.ok);
r = await as(A, "authenticated", `update public.registrations set status='approved', code='EVHACK' where user_id='${A}'`);
check("learner cannot self-approve via update (no update policy)", r.ok && r.res.affectedRows === 0, JSON.stringify(r));
r = await as(null, "anon", `select * from public.registrations`);
check("anon sees 0 registrations", !r.ok || r.res.rows.length === 0);
r = await as(C, "authenticated", `select * from public.registrations`);
check("other learner sees 0 registrations", r.ok && r.res.rows.length === 0);

const regA = (await db.query(`select id from public.registrations where user_id='${A}'`)).rows[0].id;
r = await as(A, "authenticated", `select public.approve_registration('${regA}')`);
check("learner cannot call approve", !r.ok && /not allowed/.test(r.err), JSON.stringify(r));
r = await as(null, "anon", `select public.approve_registration('${regA}')`);
check("anon cannot call approve", !r.ok);

await db.exec(`insert into public.classes (batch_id,day_no,title,join_link) values ('${batch}',1,'Day 1','https://meet/x'),('${batch}',2,'Day 2','https://meet/y')`);
r = await as(A, "authenticated", `select * from public.classes`);
check("pending learner cannot see join links", r.ok && r.res.rows.length === 0);

r = await as(B, "authenticated", `select public.approve_registration('${regA}') as code`);
check("admin approves and gets code EVxxxx", r.ok && /^EV[A-Z2-9]{4}$/.test(r.res.rows[0].code), JSON.stringify(r));
r = await as(A, "authenticated", `select * from public.classes`);
check("approved learner sees join links", r.ok && r.res.rows.length === 2);
r = await as(C, "authenticated", `select * from public.classes`);
check("unrelated user sees no classes", r.ok && r.res.rows.length === 0);

// seats full
await db.exec(`update public.batches set seats=1`);
await db.exec(`insert into public.registrations (user_id,batch_id,full_name,phone,utr,payer_upi_name,screenshot_path,declaration_ok)
               values ('${C}','${batch}','Second','9876543211','999999999999','Sam','${C}/p.png',true)`);
const regC = (await db.query(`select id from public.registrations where user_id='${C}'`)).rows[0].id;
r = await as(B, "authenticated", `select public.approve_registration('${regC}')`);
check("approval blocked when batch is full", !r.ok && /full/.test(r.err), JSON.stringify(r));
r = await as(B, "authenticated", `select public.reject_registration('${regC}', 'Wrong UTR')`);
check("admin can reject with reason", r.ok, r.err);
await db.exec(`update public.batches set seats=100`);
r = await as(A, "authenticated", `delete from public.registrations where user_id='${A}'`);
check("learner cannot delete own APPROVED registration", r.ok && r.res.affectedRows === 0, JSON.stringify(r));
r = await as(A, "authenticated", `delete from public.registrations where user_id='${C}'`);
check("learner cannot delete someone else's rejected registration", r.ok && r.res.affectedRows === 0);
r = await as(C, "authenticated", `delete from public.registrations where user_id='${C}'`);
check("learner can delete own REJECTED registration to resubmit", r.ok && r.res.affectedRows === 1, JSON.stringify(r));


// certificate rules
r = await as(B, "authenticated", `select public.issue_certificate('${regA}')`);
check("no certificate with 0 attendance", !r.ok && /attendance/.test(r.err), JSON.stringify(r));
const cls = (await db.query(`select id from public.classes order by day_no`)).rows;
await as(B, "authenticated", `insert into public.attendance (class_id,registration_id) values ('${cls[0].id}','${regA}')`);
r = await as(B, "authenticated", `select public.issue_certificate('${regA}')`);
check("no certificate without accepted project", !r.ok && /project/.test(r.err), JSON.stringify(r));

r = await as(A, "authenticated", `insert into public.submissions (registration_id,link,status) values ('${regA}','https://github.com/a/b','accepted')`);
check("learner cannot submit as 'accepted'", !r.ok);
r = await as(A, "authenticated", `insert into public.submissions (registration_id,link) values ('${regA}','https://github.com/a/b')`);
check("learner can submit project", r.ok, r.err);
r = await as(A, "authenticated", `select public.issue_certificate('${regA}')`);
check("learner cannot issue own certificate", !r.ok);
await as(B, "authenticated", `update public.submissions set status='accepted' where registration_id='${regA}'`);
r = await as(A, "authenticated", `update public.submissions set link='https://evil.example' where registration_id='${regA}'`);
check("accepted submission is locked for learner", r.ok && r.res.affectedRows === 0, JSON.stringify(r));

r = await as(B, "authenticated", `select public.issue_certificate('${regA}') as id`);
const certId = r.ok && r.res.rows[0].id;
check("certificate issued after 50% + accepted project", /^EVL-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(certId), JSON.stringify(r));
r = await as(B, "authenticated", `select public.issue_certificate('${regA}') as id`);
check("issuing twice returns the same ID", r.ok && r.res.rows[0].id === certId);

r = await as(null, "anon", `select * from public.verify_certificate('${certId.toLowerCase()}')`);
check("anon verifies (case-insensitive) and sees only 4 fields",
  r.ok && r.res.rows.length === 1 && Object.keys(r.res.rows[0]).join() === "holder_name,course,issued_on,valid" && r.res.rows[0].valid === true,
  JSON.stringify(r));
r = await as(null, "anon", `select * from public.verify_certificate('EVL-NOPE-NOPE')`);
check("unknown ID returns nothing", r.ok && r.res.rows.length === 0);
r = await as(null, "anon", `select * from public.certificates`);
check("anon sees 0 certificates from table", !r.ok || r.res.rows.length === 0);

await as(B, "authenticated", `select public.revoke_certificate('${certId}','test')`);
r = await as(null, "anon", `select valid from public.verify_certificate('${certId}')`);
check("revoked certificate shows valid=false", r.ok && r.res.rows[0].valid === false);
r = await as(A, "authenticated", `select public.revoke_certificate('${certId}','x')`);
check("learner cannot revoke", !r.ok);

r = await as(null, "anon", `select public.seats_left('${batch}') as n`);
check("anyone can see seats left", r.ok && r.res.rows[0].n === 99, JSON.stringify(r));
r = await as(null, "anon", `select public.rand_code(4)`);
check("rand_code not callable from the browser", !r.ok);

// storage
await db.exec(`insert into storage.objects (bucket_id,name) values ('payment-proofs','${A}/p.png')`);
r = await as(C, "authenticated", `select * from storage.objects`);
check("other learner cannot see A's screenshot", r.ok && r.res.rows.length === 0);
r = await as(A, "authenticated", `select * from storage.objects`);
check("A sees own screenshot", r.ok && r.res.rows.length === 1);
r = await as(B, "authenticated", `select * from storage.objects`);
check("admin sees screenshots", r.ok && r.res.rows.length === 1);
r = await as(C, "authenticated", `insert into storage.objects (bucket_id,name) values ('payment-proofs','${A}/hack.png')`);
check("cannot upload into someone else's folder", !r.ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
