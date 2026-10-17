import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
const web = resolve(import.meta.dirname, ".."),
  require = createRequire(resolve(web, "package.json"));
const out = resolve(
  web,
  "node_modules/.cache",
  `m05-server-${crypto.randomUUID()}.cjs`,
);
const { NextRequest } = require("next/server");
let api;
before(async () => {
  await mkdir(resolve(web, "node_modules/.cache"), { recursive: true });
  const stubs = {
    "@/lib/data": `export async function getViewer(){return globalThis.__M05.viewer} export async function requireViewer(){if(!globalThis.__M05.viewer)throw Error('unauthorized');return globalThis.__M05.viewer}`,
    "next/navigation": `export function redirect(){throw Error('Redirect blocked in QA')}`,
    "next/cache": `export function revalidatePath(){}`,
  };
  await build({
    stdin: {
      contents: `export {POST} from './src/app/api/files/route'; export {submitDraft} from './src/app/applicant/actions'; export {emptyPayload,newActivity} from './src/lib/domain';`,
      resolveDir: web,
      loader: "ts",
    },
    outfile: out,
    bundle: true,
    platform: "node",
    format: "cjs",
    tsconfig: resolve(web, "tsconfig.json"),
    external: ["next/server"],
    plugins: [
      {
        name: "m05-isolated-viewer",
        setup(b) {
          b.onResolve(
            { filter: /^(@\/lib\/data|next\/(cache|navigation))$/ },
            (a) => ({ path: a.path, namespace: "qa" }),
          );
          b.onLoad({ filter: /.*/, namespace: "qa" }, (a) => ({
            contents: stubs[a.path],
            loader: "js",
          }));
        },
      },
    ],
  });
  api = require(out);
});
after(async () => {
  delete globalThis.__M05;
  await unlink(out);
});
const appId = "00000000-0000-4000-8000-000000000601",
  partnerId = "11111111-1111-4111-8111-111111111111";
const letter = "partner_letter_" + partnerId.replaceAll("-", "");
function fixture() {
  const payload = api.emptyPayload();
  Object.assign(payload.concept, {
    applicant_type: "organization",
    province: "Galápagos",
    city: "Puerto Ayora",
    project_islands: ["Santa Cruz"],
    phone: "+593991234567",
    summary: "Resumen",
    partner_organizations: [{ id: partnerId, name: "Socio A" }],
    associated_organizations: ["Socio A"],
    partners: "1. Socio A",
  });
  delete payload.concept.project_results;
  delete payload.concept.strategic_alignment;
  const activity = api.newActivity();
  activity.title = "Actividad";
  activity.description = "Descripción";
  payload.activities = [activity];
  const state = {
    app: {
      payload,
      rules_snapshot: { required_attachments: [], summary_word_limit: 500 },
      stage: 2,
      revision: 0,
    },
    docs: [],
    objects: new Map(),
    uploadCount: 0,
    registerCount: 0,
    submitCount: 0,
    failUpload: false,
    failLoad: false,
    viewer: null,
  };
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.kinds = null;
    }
    select() {
      return this;
    }
    eq(k, v) {
      this.filters.push([k, v]);
      return this;
    }
    in(k, v) {
      if (k === "kind") this.kinds = v;
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    async maybeSingle() {
      if (this.table === "applications")
        return { data: state.app, error: null };
      if (this.table === "application_documents")
        return {
          data: state.docs.find((d) =>
            this.filters.every(([k, v]) => d[k] === v),
          ),
          error: null,
        };
      return { data: null, error: null };
    }
    then(resolve, reject) {
      return Promise.resolve({
        data: state.docs.filter(
          (d) => !this.kinds || this.kinds.includes(d.kind),
        ),
        error: null,
      }).then(resolve, reject);
    }
  }
  const db = {
    from: (t) => new Query(t),
    storage: {
      from: () => ({
        upload: async (path, bytes) => {
          state.uploadCount++;
          if (state.failUpload) return { error: { message: "offline" } };
          state.objects.set(path, bytes);
          return { error: null };
        },
        download: async (path) =>
          state.failLoad || !state.objects.has(path)
            ? { data: null, error: { message: "offline" } }
            : { data: new Blob([state.objects.get(path)]), error: null },
      }),
    },
    rpc: async (name, args) => {
      if (name === "submit_application") {
        state.submitCount++;
        return { data: 1, error: null };
      }
      state.registerCount++;
      const doc = {
        id: crypto.randomUUID(),
        kind: args.document_kind,
        file_name: args.original_name,
        storage_path: args.object_path,
        created_at: new Date().toISOString(),
      };
      state.docs.unshift(doc);
      return { data: doc.id, error: null };
    },
  };
  state.viewer = {
    db,
    user: { id: "00000000-0000-4000-8000-000000000602" },
    profile: { role: "applicant" },
  };
  globalThis.__M05 = state;
  return state;
}
function request(kind = letter) {
  const form = new FormData();
  form.set("application_id", appId);
  form.set("kind", kind);
  form.set(
    "file",
    new File(["%PDF-1.4\nCarta QA"], "carta.pdf", { type: "application/pdf" }),
  );
  return new NextRequest("http://localhost/api/files", {
    method: "POST",
    headers: { origin: "http://localhost" },
    body: form,
  });
}
test("M05 actual upload route rejects unknown/removed partner and failed upload; registers only successful linked file", async () => {
  const s = fixture();
  const unknown = "partner_letter_" + crypto.randomUUID().replaceAll("-", "");
  assert.equal((await api.POST(request(unknown))).status, 409);
  assert.equal(s.uploadCount, 0);
  assert.equal(s.registerCount, 0);
  s.failUpload = true;
  assert.equal((await api.POST(request())).status, 403);
  assert.equal(s.registerCount, 0);
  s.failUpload = false;
  const response = await api.POST(request());
  assert.equal(response.status, 200);
  const doc = await response.json();
  assert.equal(doc.kind, letter);
  assert.equal(s.registerCount, 1);
  s.app.payload.concept.partner_organizations = [];
  assert.equal((await api.POST(request())).status, 409);
  assert.equal(s.registerCount, 1);
});
test("M05 actual submit action blocks missing or unreadable individual letter before submit RPC; permits complete or zero-partner flow", async () => {
  const s = fixture();
  let result = await api.submitDraft(appId, 0);
  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "GLF_PARTNER_LETTER_REQUIRED:" + partnerId.replaceAll("-", ""),
  );
  assert.equal(s.submitCount, 0);
  await api.POST(request());
  s.failLoad = true;
  result = await api.submitDraft(appId, 0);
  assert.equal(result.ok, false);
  assert.match(result.error, /GLF_PARTNER_LETTER_INVALID/);
  assert.equal(s.submitCount, 0);
  s.failLoad = false;
  result = await api.submitDraft(appId, 0);
  assert.equal(result.ok, true);
  assert.equal(s.submitCount, 1);
  s.docs = [];
  s.app.payload.concept.partner_organizations = [];
  s.app.payload.concept.associated_organizations = [];
  s.app.payload.concept.partners = "";
  result = await api.submitDraft(appId, 0);
  assert.equal(result.ok, true);
  assert.equal(s.submitCount, 2);
  delete s.app.payload.concept.partner_organizations;
  s.app.payload.concept.associated_organizations = ["Socio antiguo"];
  s.app.payload.concept.partners = "Socio antiguo";
  result = await api.submitDraft(appId, 0);
  assert.equal(result.ok, false);
  assert.equal(result.error, "GLF_PARTNER_LINK_REQUIRED");
  assert.equal(s.submitCount, 2);
});
