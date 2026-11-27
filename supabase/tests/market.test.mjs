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
  grant select, insert on storage.objects to authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
await db.exec(read("0001_init.sql"));
await db.exec(read("0002_makers_market.sql"));

let pass = 0, fail = 0;
const as = async (uid, role, q) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try { return { ok: true, res: await db.query(q) }; } catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec(`reset role;`); }
};
const check = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n} ${c ? "" : x}`); };
const U = (c) => `00000000-0000-0000-0000-0000000000${c}`;
const ADMIN = U("aa"), MAKER = U("bb"), BUYER = U("cc"), MAKER2 = U("dd");
await db.exec(`insert into auth.users (id,email) values ('${ADMIN}','a@x'),('${MAKER}','m@x'),('${BUYER}','b@x'),('${MAKER2}','m2@x')`);
await db.exec(`update public.profiles set role='admin' where id='${ADMIN}'`);

const app = (u, n) => `insert into public.maker_applications (user_id,display_name,bio) values ('${u}','${n}','I build cool gadgets and toys')`;
let r = await as(BUYER, "authenticated", app(BUYER, "Buyer Co"));
check("anyone can apply to be a maker", r.ok, r.err);
r = await as(MAKER, "authenticated", app(MAKER, "Maker One"));
r = await as(MAKER, "authenticated", `update public.profiles set role='maker' where id='${MAKER}'`);
check("cannot self-promote to maker", !r.ok);
r = await as(MAKER, "authenticated", `insert into public.products (maker_id,title,description,price_inr) values ('${MAKER}','Sneaky','not yet a maker ok',100)`);
check("non-maker cannot list products", !r.ok);
const appId = (u) => db.query(`select id from public.maker_applications where user_id='${u}'`).then((x) => x.rows[0].id);
r = await as(MAKER, "authenticated", `select public.approve_maker('${await appId(MAKER)}')`);
check("learner cannot approve themselves", !r.ok);
r = await as(ADMIN, "authenticated", `select public.approve_maker('${await appId(MAKER)}')`);
check("admin approves maker", r.ok, r.err);
check("role became maker", (await db.query(`select role from public.profiles where id='${MAKER}'`)).rows[0].role === "maker");
r = await as(ADMIN, "authenticated", `select public.reject_maker('${await appId(BUYER)}','need portfolio')`);
check("admin rejects another application", r.ok, r.err);
check("rejected stays learner", (await db.query(`select role from public.profiles where id='${BUYER}'`)).rows[0].role === "learner");

const prod = (m, s = "pending") => `insert into public.products (maker_id,title,description,price_inr,status) values ('${m}','Tamagotchi keychain','Cute pet game on a keychain',499,'${s}')`;
r = await as(MAKER, "authenticated", prod(MAKER, "live"));
check("maker cannot publish directly as live", !r.ok);
r = await as(MAKER, "authenticated", prod(MAKER));
check("maker lists product (pending)", r.ok, r.err);
r = await as(MAKER2, "authenticated", prod(MAKER));
check("cannot list as someone else", !r.ok);
r = await as(null, "anon", `select * from public.products`);
check("public sees no pending products", r.ok && r.res.rows.length === 0);
const pid = (await db.query(`select id from public.products limit 1`)).rows[0].id;
r = await as(MAKER, "authenticated", `update public.products set status='live' where id='${pid}'`);
check("maker cannot self-approve product", !r.ok);
r = await as(MAKER, "authenticated", `select public.review_product('${pid}','live')`);
check("maker cannot call review_product", !r.ok);
r = await as(ADMIN, "authenticated", `select public.review_product('${pid}','live')`);
check("admin publishes product", r.ok, r.err);
r = await as(null, "anon", `select title from public.products`);
check("public sees live product", r.ok && r.res.rows.length === 1);
r = await as(MAKER2, "authenticated", `update public.products set price_inr=1 where id='${pid}'`);
check("other maker cannot edit it", r.ok && r.res.affectedRows === 0, JSON.stringify(r));
r = await as(null, "anon", `select public.maker_name('${MAKER}') as n`);
check("public sees maker display name only", r.ok && r.res.rows[0].n === "Maker One", JSON.stringify(r));

// requests + offers
r = await as(BUYER, "authenticated", `insert into public.requests (user_id,title,description,budget_inr) values ('${BUYER}','Smart plant waterer','Need an ESP32 based auto watering system for 3 pots',1500)`);
check("anyone signed in posts a request", r.ok, r.err);
const rid = (await db.query(`select id from public.requests`)).rows[0].id;
r = await as(MAKER, "authenticated", `select * from public.requests`);
check("makers can see requests", r.ok && r.res.rows.length === 1);
r = await as(MAKER2, "authenticated", `select * from public.requests`);
check("maker2 (approved later) — currently learner sees none", r.ok && r.res.rows.length === 0);
r = await as(null, "anon", `select * from public.requests`);
check("anon sees no requests", r.ok && r.res.rows.length === 0);
r = await as(BUYER, "authenticated", `insert into public.offers (request_id,maker_id,message,price_inr) values ('${rid}','${BUYER}','I can do it cheaply',900)`);
check("non-maker cannot send offers", !r.ok);
r = await as(MAKER, "authenticated", `insert into public.offers (request_id,maker_id,message,price_inr) values ('${rid}','${MAKER}','I can build this in 5 days',1200)`);
check("maker sends offer", r.ok, r.err);
r = await as(MAKER, "authenticated", `insert into public.offers (request_id,maker_id,message,price_inr) values ('${rid}','${MAKER}','second offer attempt here',1100)`);
check("one offer per maker per request", !r.ok);
r = await as(BUYER, "authenticated", `select * from public.offers`);
check("request owner sees offers", r.ok && r.res.rows.length === 1);
r = await as(MAKER2, "authenticated", `select * from public.offers`);
check("unrelated user sees no offers", r.ok && r.res.rows.length === 0);

r = await as(BUYER, "authenticated", `insert into storage.objects (bucket_id,name) values ('product-images','${BUYER}/x.png')`);
check("non-maker cannot upload product images", !r.ok);
r = await as(MAKER, "authenticated", `insert into storage.objects (bucket_id,name) values ('product-images','${MAKER}/x.png')`);
check("maker uploads to own folder", r.ok, r.err);
r = await as(MAKER, "authenticated", `insert into storage.objects (bucket_id,name) values ('product-images','${ADMIN}/x.png')`);
check("maker cannot upload to others' folder", !r.ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
