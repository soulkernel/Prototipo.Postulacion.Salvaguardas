import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
const web = resolve(import.meta.dirname, ".."),
  require = createRequire(resolve(web, "package.json")),
  out = resolve(
    web,
    "node_modules/.cache",
    `sgas-function-${crypto.randomUUID()}.cjs`,
  );
let api;
before(async () => {
  globalThis.Deno = {
    env: {
      get: (k) =>
        ({
          SUPABASE_URL: "https://qa.invalid",
          SUPABASE_ANON_KEY: "qa-anon",
          SUPABASE_SERVICE_ROLE_KEY: "qa-service",
        })[k],
    },
    serve: () => {},
  };
  await mkdir(resolve(web, "node_modules/.cache"), { recursive: true });
  await build({
    stdin: {
      contents: `export {handleSgasRequest} from '../supabase/functions/sgas-experience/source.ts';export {emptySgasExperience,sgasSource,sgasAnswerKeys} from './src/lib/sgas-experience';`,
      resolveDir: web,
      loader: "ts",
    },
    outfile: out,
    bundle: true,
    platform: "node",
    format: "cjs",
    nodePaths: [resolve(web, "node_modules")],
    plugins: [
      {
        name: "isolated-supabase-client",
        setup(b) {
          b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({
            path: "client",
            namespace: "qa",
          }));
          b.onLoad({ filter: /.*/, namespace: "qa" }, () => ({
            contents: `export function createClient(url,key){return key==='qa-service'?globalThis.__SGAS.admin:globalThis.__SGAS.user}`,
            loader: "js",
          }));
        },
      },
    ],
  });
  api = require(out);
});
after(async () => {
  await unlink(out);
  delete globalThis.__SGAS;
  delete globalThis.Deno;
});
function fixture() {
  const form = {
    ...api.emptySgasExperience(),
    ...Object.fromEntries(api.sgasAnswerKeys.map((k) => [k, false])),
  };
  const source = api.sgasSource({
    sgas_experience: form,
    title: "Proyecto ficticio",
    applicant_name: "Proponente QA",
    applicant_type: "organization",
  });
  const state = {
    owner: crypto.randomUUID(),
    uploads: [],
    registrations: [],
    removals: [],
    authError: false,
    contextError: null,
    uploadError: false,
    registerError: null,
    source,
    document: null,
  };
  state.user = {
    auth: {
      getUser: async () => ({
        data: { user: state.authError ? null : { id: state.owner } },
        error: state.authError ? { message: "invalid" } : null,
      }),
    },
    rpc: async (name, args) => {
      assert.equal(name, "sgas_document_context");
      assert.equal(args.expected_revision, 3);
      return {
        data: state.contextError
          ? null
          : {
              source: state.source,
              reference: "QA-SGAS",
              document: state.document,
              session_id: null,
            },
        error: state.contextError,
      };
    },
  };
  state.admin = {
    storage: {
      from: (bucket) => {
        assert.equal(bucket, "application-files");
        return {
          upload: async (path, bytes) => {
            state.uploads.push({ path, bytes });
            return { error: state.uploadError ? { message: "offline" } : null };
          },
          remove: async (paths) => {
            state.removals.push(...paths);
            return { error: null };
          },
        };
      },
    },
    rpc: async (name, args) => {
      assert.equal(name, "register_sgas_document");
      state.registrations.push(args);
      return {
        data: state.registerError
          ? null
          : {
              id: crypto.randomUUID(),
              kind: "sgas_experience",
              file_name: args.original_name,
              created_at: "2026-10-21T12:00:00Z",
              generation_source: args.source,
              generated_locale: args.locale,
              storage_path: args.object_path,
            },
        error: state.registerError,
      };
    },
  };
  globalThis.__SGAS = state;
  return state;
}
const app = "11111111-1111-4111-8111-111111111111";
function request(body = { id: app, revision: 3, locale: "es" }, token = true) {
  return new Request("https://qa.invalid/sgas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer qa-jwt" } : {}),
    },
    body: JSON.stringify(body),
  });
}
test("actual SGAS function requires an authenticated applicant context and never accepts arbitrary payloads", async () => {
  const s = fixture();
  assert.equal(
    (await api.handleSgasRequest(request(undefined, false))).status,
    401,
  );
  s.authError = true;
  assert.equal((await api.handleSgasRequest(request())).status, 401);
  s.authError = false;
  assert.equal(
    (
      await api.handleSgasRequest(
        request({ id: app, revision: 3, locale: "es", payload: s.source }),
      )
    ).status,
    400,
  );
  s.contextError = { message: "GLF_APPLICATION_LOCKED" };
  assert.equal((await api.handleSgasRequest(request())).status, 409);
  assert.equal(s.uploads.length, 0);
  assert.equal(s.registrations.length, 0);
});
test("actual SGAS function generates PDF bytes, uploads privately and confirms only registered documents", async () => {
  for (const locale of ["es", "en"]) {
    const s = fixture(),
      response = await api.handleSgasRequest(
        request({ id: app, revision: 3, locale }),
      );
    assert.equal(response.status, 200);
    const doc = await response.json();
    assert.ok(doc.id);
    assert.equal(doc.kind, "sgas_experience");
    assert.equal(doc.generated_locale, locale);
    assert.deepEqual(doc.generation_source, s.source);
    assert.equal(s.uploads.length, 1);
    assert.equal(s.registrations.length, 1);
    assert.equal(
      new TextDecoder().decode(s.uploads[0].bytes.slice(0, 5)),
      "%PDF-",
    );
    assert.equal(
      s.registrations[0].checksum,
      createHash("sha256").update(s.uploads[0].bytes).digest("hex"),
    );
    assert.match(s.uploads[0].path, /\/system\/sgas\//);
    assert.equal(s.registrations[0].actor_id, s.owner);
    assert.equal(doc.storage_path, undefined);
  }
});
test("SGAS upload/registration failures preserve answers and never report a completed attachment", async () => {
  const s = fixture(),
    before = structuredClone(s.source);
  s.uploadError = true;
  let response = await api.handleSgasRequest(request());
  assert.equal(response.status, 503);
  assert.equal(s.registrations.length, 0);
  assert.ok((await response.json()).error);
  assert.deepEqual(s.source, before);
  s.uploadError = false;
  s.registerError = { message: "GLF_VERSION_CONFLICT" };
  response = await api.handleSgasRequest(request());
  assert.equal(response.status, 409);
  assert.deepEqual(s.removals, []);
  assert.deepEqual(await response.json(), { error: "GLF_VERSION_CONFLICT" });
  assert.deepEqual(s.source, before);
  s.registerError = null;
  response = await api.handleSgasRequest(request());
  assert.equal(response.status, 200);
});
test("repeating an already finalized SGAS request returns its registered attachment without generating another file", async () => {
  const s = fixture();
  s.document = {
    id: crypto.randomUUID(),
    kind: "sgas_experience",
    generation_source: s.source,
  };
  const response = await api.handleSgasRequest(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, s.document.id);
  assert.equal(s.uploads.length, 0);
  assert.equal(s.registrations.length, 0);
});
test("a lost registration response preserves the committed PDF and a retry recovers it", async () => {
  const s = fixture();
  s.admin.rpc = async (name, args) => {
    assert.equal(name, "register_sgas_document");
    s.registrations.push(args);
    s.document = {
      id: crypto.randomUUID(),
      kind: "sgas_experience",
      file_name: args.original_name,
      generation_source: args.source,
      generated_locale: args.locale,
    };
    return { data: null, error: { message: "network response lost" } };
  };
  assert.equal((await api.handleSgasRequest(request())).status, 409);
  assert.equal(s.uploads.length, 1);
  assert.equal(s.registrations.length, 1);
  assert.deepEqual(s.removals, []);
  const retry = await api.handleSgasRequest(request());
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).id, s.document.id);
  assert.equal(s.uploads.length, 1);
  assert.equal(s.registrations.length, 1);
  assert.deepEqual(s.removals, []);
});
