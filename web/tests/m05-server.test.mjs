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
      contents: `export {POST} from './src/app/api/files/route'; export {saveDraft,submitDraft,prepareDocuments,removePartner} from './src/app/applicant/actions'; export {emptyPayload,newActivity} from './src/lib/domain';`,
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
test("actual partner-removal action validates IDs and reports Storage failure before finalization", async()=>{
 const state=fixture(),calls=[];
 assert.deepEqual(await api.removePartner('bad',0,partnerId),{ok:false,error:'GLF_INVALID_PAYLOAD',pending:false});
 assert.deepEqual(await api.removePartner(appId,-1,partnerId),{ok:false,error:'GLF_INVALID_PAYLOAD',pending:false});
 assert.equal(state.registerCount,0);
 let fail=true;
 state.viewer.db.rpc=async(name)=>{calls.push(name);return {data:name==='begin_remove_partner'?{done:false,paths:['confirmed-letter.pdf']}:{revision:1,payload:state.app.payload},error:null}};
 state.viewer.db.storage.from=()=>({remove:async paths=>{assert.deepEqual(paths,['confirmed-letter.pdf']);return {error:fail?{message:'offline'}:null}}});
 assert.deepEqual(await api.removePartner(appId,0,partnerId),{ok:false,error:'GLF_DELETE_FILES_PENDING',pending:true});
 assert.deepEqual(calls,['begin_remove_partner']);
 fail=false;assert.equal((await api.removePartner(appId,0,partnerId)).ok,true);
 assert.deepEqual(calls,['begin_remove_partner','begin_remove_partner','finish_remove_partner']);
});
function fixture() {
  const payload = api.emptyPayload();
  Object.assign(payload.concept, {
    applicant_type: "organization",
    project_type: "research",
    province: "Galápagos",
    city: "Puerto Ayora",
    project_islands: ["Santa Cruz"],
    phone: "+593991234567",
    summary: "Resumen",
    partner_organizations: [{ id: partnerId, name: "Socio A", support: "Apoyo técnico ficticio" }],
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
      rules_snapshot: { required_attachments: [], summary_word_limit: 500, themes: [{id:"research",label_es:"Investigación",label_en:"Research"}] },
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
      if (name === "save_application") {
        state.savedPayload = structuredClone(args.payload);
        return { data: args.expected_revision + 1, error: null };
      }
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

test("M15 actual save action accepts missing contribution and retains old values without copying them into active narratives", async () => {
  const s = fixture();
  const general = { id: crypto.randomUUID(), kind: "general", text: "Conservar hábitats", plan: ["E1"], ods: [14], glf: [] };
  const specific = { id: crypto.randomUUID(), kind: "specific", text: "Restaurar hábitats", plan: [], ods: [], glf: [] };
  s.app.payload.concept.strategic_alignment = { version: "pg2030-ods-general-v3", objectives: [general, specific] };
  assert.equal((await api.saveDraft(appId, 0, s.app.payload)).ok, true);
  assert.equal("contribution" in s.savedPayload.concept.strategic_alignment.objectives[0], false);
  general.contribution = "APORTE_HISTORICO_M15";
  assert.equal((await api.saveDraft(appId, 1, s.app.payload)).ok, true);
  assert.equal(s.savedPayload.concept.strategic_alignment.objectives[0].contribution, "APORTE_HISTORICO_M15");
  for (const key of ["objectives", "alignment", "summary", "results", "beneficiaries"]) assert.doesNotMatch(s.savedPayload.concept[key], /APORTE_HISTORICO_M15/);
});

test("M13 actual save action preserves optional instruments and objective links, including incomplete drafts", async () => {
  const s = fixture();
  const general = { id: crypto.randomUUID(), kind: "general", text: "Conservar hábitats", plan: ["E1"], ods: [14], glf: [], contribution: "Conservación", other_instruments: [{ id: crypto.randomUUID(), name: "", objective: "" }] };
  const specific = { id: crypto.randomUUID(), kind: "specific", text: "Restaurar hábitats", plan: [], ods: [], glf: [], contribution: "" };
  s.app.payload.concept.strategic_alignment = { version: "pg2030-ods-general-v2", objectives: [general, specific] };
  s.app.payload.activities[0].objective_ids = [specific.id];
  assert.equal((await api.saveDraft(appId, 0, s.app.payload)).ok, true);
  assert.deepEqual(s.savedPayload.concept.strategic_alignment.objectives[0].other_instruments, general.other_instruments);
  general.other_instruments[0].name = "Plan ficticio M13";
  general.other_instruments[0].objective = "Objetivo externo ficticio";
  assert.equal((await api.saveDraft(appId, 1, s.app.payload)).ok, true);
  assert.match(s.savedPayload.concept.alignment, /Plan ficticio M13/);
  assert.equal(s.savedPayload.concept.strategic_alignment.objectives[0].id, general.id);
  assert.deepEqual(s.savedPayload.activities[0].objective_ids, [specific.id]);
  general.other_instruments[0].id = "invalid";
  assert.deepEqual(await api.saveDraft(appId, 2, s.app.payload), { ok: false, error: "GLF_INVALID_PAYLOAD" });
});

test("M08 actual save action accepts a missing administrative estimate and preserves an old amount", async () => {
  const s = fixture();
  s.app.stage = 1;
  delete s.app.payload.concept.admin_cost;
  const original = structuredClone(s.app.payload);
  assert.deepEqual(await api.saveDraft(appId, 0, s.app.payload), {ok:true,revision:1});
  assert.equal(s.savedPayload.concept.admin_cost, null);
  assert.deepEqual(s.app.payload, original);
  s.app.payload.concept.admin_cost = 987.65;
  assert.deepEqual(await api.saveDraft(appId, 1, s.app.payload), {ok:true,revision:2});
  assert.equal(s.savedPayload.concept.admin_cost, 987.65);
});
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
  assert.equal(result.error, "GLF_REQUIRED:partners");
  assert.equal(s.submitCount, 2);
});

test("M07 actual server actions block missing catalogues and foreign or historical topics before preparation/submission RPC", async () => {
  for (const themes of [undefined, []]) {
    const s = fixture();
    s.app.rules_snapshot.themes = themes;
    const original = structuredClone(s.app);
    assert.deepEqual(await api.submitDraft(appId, 0), {ok:false,error:"GLF_CALL_THEMES_REQUIRED"});
    assert.deepEqual(await api.prepareDocuments(appId, 0), {error:"GLF_CALL_THEMES_REQUIRED"});
    assert.equal(s.submitCount, 0);
    assert.equal(s.registerCount, 0);
    assert.deepEqual(s.app, original);
  }
  for (const value of ["education", "Investigación", "Tema histórico"]) {
    const s = fixture();
    s.app.payload.concept.project_type = value;
    assert.equal((await api.submitDraft(appId,0)).error, "GLF_INVALID_PROJECT_THEME");
    assert.equal((await api.prepareDocuments(appId,0)).error, "GLF_INVALID_PROJECT_THEME");
    assert.equal(s.submitCount, 0);
    assert.equal(s.registerCount, 0);
    assert.equal(s.app.payload.concept.project_type, value);
  }
  // With its own catalogue selection, the actual action can reach the mocked RPC.
  for (const id of ["research", "education"]) {
    const s = fixture();
    s.app.payload.concept.project_type = id;
    s.app.rules_snapshot.themes = [{id,label_es:"Tema de prueba",label_en:"Test topic"}];
    Object.assign(s.app.payload.concept, {partner_organizations:[],associated_organizations:[],partners:""});
    assert.equal((await api.submitDraft(appId,0)).ok, true);
    assert.equal(s.submitCount, 1);
  }
});
