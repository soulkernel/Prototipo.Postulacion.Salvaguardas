import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "node_modules/.cache", `account-${crypto.randomUUID()}.cjs`);
let handle;
before(async () => {
  globalThis.Deno = {
    env: { get: key => ({ SUPABASE_URL: "https://qa.invalid", SUPABASE_ANON_KEY: "qa-public", SUPABASE_SERVICE_ROLE_KEY: "qa-service" })[key] },
    serve: fn => { handle = fn; },
  };
  await build({ entryPoints: [resolve(root, "../supabase/functions/user-administration/index.ts")],
    bundle: true, platform: "node", format: "cjs", outfile: output,
    plugins: [{ name: "isolated-client", setup(b) {
      b.onResolve({ filter: /^npm:@supabase/ }, () => ({ path: "client", namespace: "qa" }));
      b.onLoad({ filter: /.*/, namespace: "qa" }, () => ({ contents: "export const createClient = (_url,key) => key==='qa-service'?globalThis.__ACCOUNT.admin:globalThis.__ACCOUNT.caller;" }));
    }}],
  });
  createRequire(import.meta.url)(output);
});
after(async () => { await unlink(output); delete globalThis.Deno; delete globalThis.__ACCOUNT; });
function fixture() {
  const state = { role: "administrator", access_kind: "standard", aal: "aal2", valid: true, prepared: [], deleted: [], prepareError: null };
  state.caller = {
    auth: { getUser: async () => ({ data: { user: { id: "admin" } } }), getClaims: async () => ({ data: { claims: { aal: state.aal } } }) },
    from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { role: state.role, access_kind: state.access_kind, active: true } }) }),
    rpc: async (name,args) => {
      if (name === "access_session_valid") return { data: state.valid };
      assert.equal(name, "prepare_account_deletion"); state.prepared.push(args); return { error: state.prepareError };
    },
  };
  state.admin = { auth: { admin: { deleteUser: async id => { state.deleted.push(id); return {}; }, createUser: () => { throw Error("Retired provisioning must never run"); } } } };
  globalThis.__ACCOUNT = state;
  return state;
}
const request = body => handle(new Request("https://qa.invalid/user-administration", { method: "POST", headers: { Authorization: "Bearer qa-session", "Content-Type": "application/json" }, body: JSON.stringify(body) }));
test("retired provisioning is rejected even for an administrator", async () => {
  const f = fixture();
  const response = await request({ operation: "create_academic", email: "retired@example.test", full_name: "Test", confirmed: true });
  assert.equal(response.status,400); assert.equal((await response.json()).error,"GLF_INVALID_OPERATION");
  assert.deepEqual(f.prepared,[]); assert.deepEqual(f.deleted,[]);
});
test("account service keeps administrator status checks with MFA and valid sessions", async () => {
  fixture(); assert.equal((await request({operation:"status"})).status,200);
  for (const [field,value] of [["role","applicant"],["access_kind","academic"],["aal","aal1"],["valid",false]]) {
    const f = fixture(); f[field] = value;
    assert.equal((await request({operation:"status"})).status,403);
  }
});
test("account deletion still validates the database guard before deleting the identity", async () => {
  const f = fixture(), id = crypto.randomUUID();
  const body = { operation:"delete", id, revision:2, reason:"Retire unused test account", confirmed:true };
  f.prepareError = {message:"GLF_ACCOUNT_HAS_HISTORY"};
  assert.equal((await request(body)).status,409); assert.deepEqual(f.deleted,[]);
  f.prepareError = null;
  assert.equal((await request(body)).status,200); assert.deepEqual(f.deleted,[id]);
  assert.deepEqual(f.prepared[0],{target_user:id,expected_revision:2,reason:body.reason});
});
