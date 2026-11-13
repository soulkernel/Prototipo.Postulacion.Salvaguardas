import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputs = [];
let access, evidence;
before(async () => {
  async function isolated(entry, stubs) {
    const out = resolve(root, "node_modules/.cache", `navigation-${crypto.randomUUID()}.cjs`);
    outputs.push(out);
    await build({ entryPoints: [resolve(root, entry)], outfile: out, bundle: true, platform: "node", format: "cjs",
      tsconfig: resolve(root, "tsconfig.json"), plugins: [{ name: "navigation-isolated", setup(b) {
        b.onResolve({ filter: /.*/ }, a => Object.hasOwn(stubs, a.path) ? { path: a.path, namespace: "mock" } : undefined);
        b.onLoad({ filter: /.*/, namespace: "mock" }, a => ({ contents: stubs[a.path], loader: "js" }));
      } }] });
    return createRequire(import.meta.url)(out);
  }
  access = await isolated("src/lib/data.ts", {
    "server-only": "",
    "react": "export const cache = fn => fn", // One fresh request per invocation in this harness.
    "next/navigation": "export function redirect(path){throw Object.assign(new Error('redirect'),{location:path})}; export function notFound(){throw new Error('not found')}",
    "./supabase/server": "export async function createSupabaseServerClient(){return globalThis.__NAV_QA.db}",
  });
  evidence = (await isolated("src/app/internal/evidence/page.tsx", {
    "@/lib/data": "export async function requireRagViewer(){const f=globalThis.__NAV_QA; return {db:f.db,profile:f.profile}}",
    "@/lib/locale": "export async function getLocale(){return 'es'}",
    "@/lib/qwen": "export function qwenConfigured(){return true}",
    "@/lib/rag": "export function ragConfigured(){return true}",
    ...Object.fromEntries([
      ["module-heading", "ModuleHeading"], ["back-link", "BackLink"], ["shell", "Shell"],
      ["rag-workspace", "RagWorkspace"], ["corpus-import", "CorpusImport"],
    ].map(([file, name]) => [`@/components/${file}`, `export const ${name} = '${name}'`])),
  })).default;
});
after(async () => { delete globalThis.__NAV_QA; await Promise.all(outputs.map(file => unlink(file))); });

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
function fixture() {
  const f = { profile: { id: "user-a", role: "administrator", active: true, access_kind: "standard", user_admin_scope: "all" },
    authError: null, profileError: null, sessionError: null, sessionValid: true, aal: "aal2", calls: [],
    db: { auth: {
      getUser: async () => { f.calls.push("auth"); return { data: { user: { id: "user-a" } }, error: f.authError }; },
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: f.aal } }) },
    },
    from(table) { f.calls.push(table); return { select() { return this; }, eq() { return this; },
      maybeSingle() { return f.profilePending?.promise ?? Promise.resolve({ data: f.profile, error: f.profileError }); },
    }; },
    rpc(name) { f.calls.push(name); return f.sessionPending?.promise ?? Promise.resolve({ data: f.sessionValid, error: f.sessionError }); },
  } };
  globalThis.__NAV_QA = f;
  return f;
}
test("verified user is required before concurrent profile and session checks; rendering waits for both", async () => {
  const f = fixture(); f.profilePending = deferred(); f.sessionPending = deferred();
  let finished = false;
  const pending = access.getViewer().then(value => { finished = true; return value; });
  await new Promise(setImmediate);
  assert.deepEqual(f.calls, ["auth", "profiles", "access_session_valid"]);
  f.profilePending.resolve({ data: f.profile, error: null });
  await new Promise(setImmediate);
  assert.equal(finished, false);
  f.sessionPending.resolve({ data: true, error: null });
  assert.equal((await pending).profile.id, "user-a");
});
test("revoked sessions and inactive profiles never yield a viewer", async () => {
  const f = fixture(); f.sessionValid = false; assert.equal(await access.getViewer(), null);
  f.sessionValid = true; f.profile.active = false; assert.equal(await access.getViewer(), null);
});
test("a later request observes revocation rather than reusing authorization", async () => {
  const f = fixture(); assert.ok(await access.getViewer()); f.sessionValid = false;
  assert.equal(await access.getViewer(), null); assert.equal(f.calls.filter(x => x === "access_session_valid").length, 2);
});
test("invalid authentication stops before any profile or database reads", async () => {
  const f = fixture(); f.authError = { status: 401 }; assert.equal(await access.getViewer(), null);
  assert.deepEqual(f.calls, ["auth"]);
});
test("transient auth, profile and session errors remain retryable failures instead of false login redirects", async () => {
  for (const field of ["authError", "profileError", "sessionError"]) {
    const f = fixture(); f[field] = { status: 503 };
    await assert.rejects(access.getViewer(), /GLF_ACCESS_UNAVAILABLE/);
  }
});
test("internal access still enforces MFA and allowed roles", async () => {
  const f = fixture(); f.aal = "aal1";
  await assert.rejects(access.requireViewer(["administrator"]), e => e.location === "/security");
  f.aal = "aal2"; f.profile.role = "applicant";
  await assert.rejects(access.requireViewer(["administrator"]), e => e.location === "/applicant");
});
test("academic access remains read only and cannot enter mutating viewer paths", async () => {
  const f = fixture(); f.profile.access_kind = "academic";
  assert.ok(await access.requireRagViewer()); assert.ok(await access.requireReadViewer());
  await assert.rejects(access.requireViewer(["administrator"]), e => e.location === "/evaluation");
});

function corpusFixture(academic = false, available = true, fail = false) {
  const f = fixture(); f.profile.access_kind = academic ? "academic" : "standard";
  f.db.from = table => {
    f.calls.push(table);
    const query = { select(_columns, options) { assert.equal(options?.count, undefined); return this; },
      eq(key, value) { assert.equal(key, "approved"); assert.equal(value, true); return this; },
      order: async () => ({ data: [{ id: "call-a", title_es: "Convocatoria", title_en: "Call" }], error: null }),
      limit: async n => { assert.equal(n, 1); return { data: available ? [{ id: "chunk-a" }] : [], error: fail ? new Error("network") : null }; },
    };
    return query;
  };
  f.db.rpc = async name => { assert.equal(name, "academic_source_count"); f.calls.push(name);
    return { data: available ? 1 : 0, error: fail ? new Error("network") : null }; };
  return f;
}
function workspace(element) {
  if (!element || typeof element !== "object") return undefined;
  if (element.type === "RagWorkspace") return element.props;
  return [element.props?.children].flat().map(workspace).find(Boolean);
}
test("RAG availability uses approved sources without counting the entire corpus", async () => {
  for (const available of [true, false]) {
    const f = corpusFixture(false, available);
    const props = workspace(await evidence({ searchParams: Promise.resolve({ project: "project-a" }) }));
    assert.equal(props.e5Enabled, available); assert.equal(props.initialProject, "project-a");
    assert.equal(props.calls[0].title, "Convocatoria"); assert.equal(props.readOnly, false);
    assert.deepEqual(f.calls, ["calls", "knowledge_chunks"]);
  }
});
test("academic RAG checks only its authorized source scope", async () => {
  const f = corpusFixture(true);
  const props = workspace(await evidence({ searchParams: Promise.resolve({}) }));
  assert.equal(props.readOnly, true); assert.equal(props.e5Enabled, true);
  assert.deepEqual(f.calls, ["calls", "academic_source_count"]);
});
test("corpus outages surface as retryable page errors in standard and academic access", async () => {
  for (const academic of [false, true]) {
    corpusFixture(academic, true, true);
    await assert.rejects(evidence({ searchParams: Promise.resolve({}) }), /Corpus status unavailable/);
  }
});
