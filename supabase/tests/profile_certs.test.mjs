import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const read = (f) => fs.readFileSync(new URL(`../migrations/${f}`, import.meta.url), "utf8");
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
  grant select, insert, update, delete on storage.objects to authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
for (const f of ["0001_init.sql", "0002_makers_market.sql", "0003_request_kind.sql", "0004_profile_cert_templates.sql"]) await db.exec(read(f));

let pass = 0, fail = 0;
const as = async (uid, role, q) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try { return { ok: true, res: await db.query(q) }; } catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec(`reset role;`); }
};
const check = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n} ${c ? "" : x}`); };
const U = (c) => `00000000-0000-0000-0000-0000000000${c}`;
const ADMIN = U("aa"), L1 = U("11"), L2 = U("22"), L3 = U("33");
await db.exec(`insert into auth.users (id,email) values ('${ADMIN}','a@x'),('${L1}','l1@x'),('${L2}','l2@x'),('${L3}','l3@x')`);
await db.exec(`update public.profiles set role='admin' where id='${ADMIN}'`);

// ── profile ──
let r = await as(L1, "authenticated", `update public.profiles set full_name='Asha Raman', avatar_path='${L1}/a.jpg' where id='${L1}'`);
check("learner edits own name + photo", r.ok, r.err);
r = await as(L1, "authenticated", `select full_name, avatar_path from public.profiles where id='${L1}'`);
check("changes were saved", r.res?.rows[0]?.full_name === "Asha Raman" && r.res.rows[0].avatar_path === `${L1}/a.jpg`);
r = await as(L1, "authenticated", `update public.profiles set role='admin' where id='${L1}'`);
check("learner still cannot make themselves admin", !r.ok);
r = await as(L1, "authenticated", `update public.profiles set full_name='X' where id='${L1}'`);
check("1-character name rejected", !r.ok);
r = await as(L1, "authenticated", `update public.profiles set full_name='${"a".repeat(61)}' where id='${L1}'`);
check("61-character name rejected", !r.ok);
r = await as(L1, "authenticated", `update public.profiles set avatar_path='x' where id='${L2}'`);
check("cannot change someone else's photo (0 rows)", r.ok && r.res.affectedRows === 0, JSON.stringify(r));
r = await as(L1, "authenticated", `insert into storage.objects (bucket_id,name) values ('avatars','${L1}/me.jpg')`);
check("upload photo to own folder", r.ok, r.err);
r = await as(L1, "authenticated", `insert into storage.objects (bucket_id,name) values ('avatars','${L2}/me.jpg')`);
check("cannot upload into another user's folder", !r.ok);

// ── templates ──
const tpl = (n) => `insert into public.certificate_templates (name,image_path) values ('${n}','t/${n}.png')`;
r = await as(L1, "authenticated", tpl("L"));
check("learner cannot add a template", !r.ok);
r = await as(null, "anon", tpl("A"));
check("anon cannot add a template", !r.ok);
r = await as(ADMIN, "authenticated", tpl("T1"));
check("admin adds template", r.ok, r.err);
r = await as(ADMIN, "authenticated", tpl("T2"));
check("admin adds second template", r.ok, r.err);
r = await as(ADMIN, "authenticated", `insert into public.certificate_templates (name,image_path,name_x) values ('Bad','p',150)`);
check("position outside 0-100 rejected", !r.ok);
r = await as(ADMIN, "authenticated", `insert into public.certificate_templates (name,image_path,name_color) values ('Bad2','p','red')`);
check("invalid colour rejected", !r.ok);
r = await as(L1, "authenticated", `select public.activate_certificate_template((select id from public.certificate_templates limit 1))`);
check("learner cannot activate a template", !r.ok);
const ids = (await db.query(`select id from public.certificate_templates order by created_at`)).rows.map((x) => x.id);
await as(ADMIN, "authenticated", `select public.activate_certificate_template('${ids[0]}')`);
r = await as(ADMIN, "authenticated", `select public.activate_certificate_template('${ids[1]}')`);
check("admin activates", r.ok, r.err);
r = await as(null, "anon", `select id from public.certificate_templates where is_active`);
check("exactly one active template, readable by anyone", r.ok && r.res.rows.length === 1 && r.res.rows[0].id === ids[1]);
r = await as(ADMIN, "authenticated", `insert into storage.objects (bucket_id,name) values ('certificate-templates','t/x.png')`);
check("admin uploads template image", r.ok, r.err);
r = await as(L1, "authenticated", `insert into storage.objects (bucket_id,name) values ('certificate-templates','t/y.png')`);
check("learner cannot upload template image", !r.ok);

// ── issuing ──
await db.exec(`
  insert into public.batches (id,name,course_title) values ('${U("b0")}','B','Absolute Basics of Electronics & IoT');
  insert into public.classes (batch_id,day_no,title) values ('${U("b0")}',1,'d1'),('${U("b0")}',2,'d2');
`);
const reg = (u, nm, code) => `insert into public.registrations (user_id,batch_id,full_name,phone,utr,payer_upi_name,screenshot_path,declaration_ok,status,code)
  values ('${u}','${U("b0")}','${nm}','9999999999','UTR${code}0000000','Payer','s',true,'approved','${code}')`;
await db.exec(reg(L1, "Asha R (registration)", "EV1111"));
await db.exec(reg(L2, "Bala K", "EV2222"));
await db.exec(reg(L3, "Chitra S", "EV3333"));
const rid = async (u) => (await db.query(`select id from public.registrations where user_id='${u}'`)).rows[0].id;
const [r1, r2, r3] = [await rid(L1), await rid(L2), await rid(L3)];
const cls = (await db.query(`select id from public.classes order by day_no`)).rows.map((x) => x.id);
// L1: full attendance + accepted. L2: attendance only. L3: both but we will leave project submitted.
await db.exec(`
  insert into public.attendance (class_id,registration_id) values ('${cls[0]}','${r1}'),('${cls[1]}','${r1}'),('${cls[0]}','${r2}'),('${cls[0]}','${r3}');
  insert into public.submissions (registration_id,link,status) values ('${r1}','https://x.y','accepted'),('${r3}','https://x.y','submitted');
`);
r = await as(L1, "authenticated", `select public.issue_all_eligible('${U("b0")}')`);
check("learner cannot bulk-issue", !r.ok);
r = await as(ADMIN, "authenticated", `select public.issue_all_eligible('${U("b0")}') as n`);
check("bulk issue only issues the eligible one", r.ok && Number(r.res.rows[0].n) === 1, JSON.stringify(r));
r = await as(L1, "authenticated", `select cert_id, holder_name from public.certificates`);
check("certificate prints the learner's PROFILE name", r.ok && r.res.rows[0]?.holder_name === "Asha Raman", JSON.stringify(r));
r = await as(L2, "authenticated", `select * from public.certificates`);
check("other learners cannot see it", r.ok && r.res.rows.length === 0);
const cid = (await db.query(`select cert_id from public.certificates`)).rows[0].cert_id;
r = await as(L1, "authenticated", `update public.profiles set full_name='Changed After' where id='${L1}'`);
r = await as(null, "anon", `select holder_name, valid from public.verify_certificate('${cid}')`);
check("name is frozen at issue time (rename afterwards does not change it)", r.ok && r.res.rows[0].holder_name === "Asha Raman" && r.res.rows[0].valid === true, JSON.stringify(r));
r = await as(L1, "authenticated", `select public.rename_certificate_holder('${cid}','Hacker')`);
check("learner cannot rename a certificate", !r.ok);
r = await as(ADMIN, "authenticated", `select public.rename_certificate_holder('${cid}','Asha Raman K')`);
check("admin can fix a typo", r.ok, r.err);
r = await as(null, "anon", `select holder_name from public.verify_certificate('${cid}')`);
check("verify shows the corrected name", r.res?.rows[0]?.holder_name === "Asha Raman K");
r = await as(ADMIN, "authenticated", `select public.issue_all_eligible('${U("b0")}') as n`);
check("second bulk run issues nobody new", r.ok && Number(r.res.rows[0].n) === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
