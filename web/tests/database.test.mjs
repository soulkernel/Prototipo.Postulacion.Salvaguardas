import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
const db = new PGlite({ extensions: { vector } });
const ids = {
  applicant: "00000000-0000-4000-8000-000000000001",
  other: "00000000-0000-4000-8000-000000000002",
  grants: "00000000-0000-4000-8000-000000000003",
  reviewer: "00000000-0000-4000-8000-000000000004",
  coordinator: "00000000-0000-4000-8000-000000000005",
  committee: "00000000-0000-4000-8000-000000000006",
  admin: "00000000-0000-4000-8000-000000000007",
};
const rules = {
  categories: [
    {
      id: "small",
      label_es: "Prueba",
      label_en: "Test",
      min_amount: 1,
      max_amount: 100000,
      max_months: 12,
      cofinance_percent: 0,
    },
  ],
  applicant_types: ["organization", "individual"],
  summary_word_limit: 500,
  max_admin_percent: 10,
  required_attachments: [],
  privacy_es: "Aviso de prueba",
  privacy_en: "Test notice",
};
let call, app;
async function as(user, fn) {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    ids[user] || user || "",
  ]);
  try {
    const result = await fn();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
async function rpc(name, args, user = "applicant") {
  const values = Object.values(args);
  const keys = Object.keys(args);
  return as(
    user,
    async () =>
      (
        await db.query(
          "select public." +
            name +
            "(" +
            keys.map((k, i) => k + "=>$" + (i + 1)).join(",") +
            ") as result",
          values,
        )
      ).rows[0].result,
  );
}
before(async () => {
  await db.exec(String.raw`
 create role anon nologin; create role authenticated nologin;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('request.jwt.claim.aal',true),''),'aal2'))$$;
 grant usage on schema auth,storage to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb,primary key(bucket_id,name));
 alter table storage.objects enable row level security;
 grant select,insert on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
 `);
  const migrations = new URL("../../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(migrations))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    try {
      await db.exec(await readFile(new URL(name, migrations), "utf8"));
    } catch (e) {
      throw new Error("Migration " + name + ": " + e.message, { cause: e });
    }
  }
  const roles = {
    applicant: "applicant",
    other: "applicant",
    grants: "grants_manager",
    reviewer: "sustainability_reviewer",
    coordinator: "project_coordinator",
    committee: "committee_member",
    admin: "administrator",
  };
  for (const [name, id] of Object.entries(ids)) {
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [id, name + "@example.test", { full_name: name, role: "administrator" }],
    );
    await db.query("update public.profiles set role=$1 where id=$2", [
      roles[name],
      id,
    ]);
  }
  call = await rpc(
    "create_call",
    {
      details: {
        code: "TEST",
        title_es: "Convocatoria prueba",
        title_en: "Test call",
        opens_at: "2020-01-01T00:00:00Z",
        closes_at: "2099-12-31T00:00:00Z",
        rules,
        phase2_schema: [
          {
            id: "proposal",
            label_es: "Propuesta",
            label_en: "Proposal",
            required: true,
            type: "text",
          },
        ],
      },
    },
    "grants",
  );
  await rpc("publish_call", { call_id: call }, "grants");
  app = await rpc("create_application", { call_id: call });
});
after(async () => await db.close());
test("anonymous sees only published calls and cannot invoke mutations", async () => {
  await db.exec("begin; set local role anon;");
  try {
    assert.equal(
      (await db.query("select id from public.calls")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select * from public.applications"),
      /permission denied/,
    );
  } finally {
    await db.exec("rollback");
  }
});
test("another applicant cannot see the application or mutate it", async () => {
  assert.equal(
    (
      await as("grants", () =>
        db.query("select * from public.applications where id=$1", [app]),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (
      await as("other", () =>
        db.query("select * from public.applications where id=$1", [app]),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    rpc(
      "save_application",
      {
        application_id: app,
        expected_revision: 0,
        payload: { concept: {}, activities: [] },
      },
      "other",
    ),
    /GLF_APPLICATION_LOCKED/,
  );
});
test("direct workflow and role edits are denied", async () => {
  await assert.rejects(
    as("applicant", () =>
      db.query("update public.applications set status='approved' where id=$1", [
        app,
      ]),
    ),
    /permission denied/,
  );
  await assert.rejects(
    as("applicant", () =>
      db.query("update public.profiles set role='administrator' where id=$1", [
        ids.applicant,
      ]),
    ),
    /permission denied/,
  );
  await assert.rejects(
    rpc("assign_staff_role", {
      target_user: ids.other,
      assigned_role: "administrator",
    }),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc(
      "assign_staff_role",
      { target_user: ids.other, assigned_role: "administrator" },
      "00000000-0000-4000-8000-000000000099",
    ),
    /GLF_FORBIDDEN/,
  );
});
const fullPayload = {
  concept: {
    title: "Proyecto de prueba",
    applicant_type: "organization",
    applicant_name: "Organización de prueba",
    contact_name: "Persona de prueba",
    email: "applicant@example.test",
    phone: "123456789",
    address: "Galápagos",
    partners: "",
    location: "Santa Cruz",
    project_type: "Conservación",
    category_id: "small",
    summary: "Resumen de prueba",
    objectives: "Objetivos",
    beneficiaries: "Beneficiarios",
    results: "Metas esperadas",
    sustainability: "Sostenibilidad",
    alignment: "Alineación",
    monitoring: "Monitoreo propuesto",
    environmental_risks: "Ambientales",
    social_risks: "Sociales",
    requested_amount: 50000,
    cofinance_amount: 0,
    admin_cost: 1000,
    start_date: "2027-01-01",
    end_date: "2027-06-30",
  },
  activities: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "Restauración",
      description: "Restauración costera",
      risks: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          dimension: "environmental",
          name: "Alteración del hábitat",
          description: "Descripción",
          probability: 3,
          severity: 4,
          residual_probability: 2,
          residual_severity: 2,
          location: "Santa Cruz",
          cost: 100,
          responsible: "Coordinador",
          start_quarter: 1,
          end_quarter: 2,
          measures: [{ text: "Medida propuesta por el solicitante" }],
        },
      ],
    },
  ],
  phase2: {},
  consent: true,
  truthful: true,
};
const payload = structuredClone(fullPayload);
Object.assign(payload.activities[0].risks[0], {
  measures: [],
  residual_probability: null,
  residual_severity: null,
  cost: null,
  location: "",
  responsible: "",
  start_quarter: null,
  end_quarter: null,
});
test("screening rejects mitigation fields before phase two", async () => {
  await assert.rejects(
    rpc("save_application", {
      application_id: app,
      expected_revision: 0,
      payload: fullPayload,
    }),
    /GLF_SCREENING_ONLY/,
  );
});
test("draft saving calculates risks and rejects stale writes", async () => {
  assert.equal(
    await rpc("save_application", {
      application_id: app,
      expected_revision: 0,
      payload,
    }),
    1,
  );
  const risk = (
    await as("applicant", () =>
      db.query(
        "select initial_score,residual_score,duration_quarters from public.risks where application_id=$1",
        [app],
      ),
    )
  ).rows[0];
  assert.deepEqual(risk, {
    initial_score: 12,
    residual_score: null,
    duration_quarters: null,
  });
  await assert.rejects(
    rpc("save_application", {
      application_id: app,
      expected_revision: 0,
      payload,
    }),
    /GLF_VERSION_CONFLICT/,
  );
});
test("submission freezes a version and blocks all later applicant writes", async () => {
  assert.equal(
    await rpc("submit_application", {
      application_id: app,
      expected_revision: 1,
    }),
    2,
  );
  await assert.rejects(
    rpc("save_application", {
      application_id: app,
      expected_revision: 2,
      payload,
    }),
    /GLF_APPLICATION_LOCKED/,
  );
  await assert.rejects(
    as("applicant", () =>
      db.query("delete from public.risks where application_id=$1", [app]),
    ),
    /permission denied/,
  );
  assert.equal(
    (
      await as("applicant", () =>
        db.query(
          "select * from public.application_versions where application_id=$1",
          [app],
        ),
      )
    ).rows.length,
    1,
  );
});
test("staff permissions are specific: coordinator cannot record safeguards or committee approval", async () => {
  await assert.rejects(
    rpc(
      "record_review",
      {
        application_id: app,
        expected_revision: 2,
        review_type: "safeguards",
        findings: "x",
        recommendation: "x",
      },
      "coordinator",
    ),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc(
      "record_decision",
      {
        application_id: app,
        expected_revision: 2,
        body: "committee",
        decision: "invite",
        reference: "x",
        rationale: "x",
        invitation_deadline: "2099-01-01",
      },
      "grants",
    ),
    /GLF_FORBIDDEN/,
  );
});
test("decision requires the reviewed current version; an invitation never means approval", async () => {
  await assert.rejects(
    rpc(
      "record_decision",
      {
        application_id: app,
        expected_revision: 2,
        body: "committee",
        decision: "invite",
        reference: "ACTA",
        rationale: "Test",
        invitation_deadline: "2099-01-01",
      },
      "committee",
    ),
    /GLF_TECHNICAL_REVIEW_REQUIRED/,
  );
  await rpc(
    "record_review",
    {
      application_id: app,
      expected_revision: 2,
      review_type: "safeguards",
      findings: "Revisión de prueba",
      recommendation: "Continuar",
      category: "Valoración humana",
    },
    "reviewer",
  );
  assert.equal(
    (
      await as("applicant", () =>
        db.query("select * from public.technical_reviews"),
      )
    ).rows.length,
    0,
  );
  await rpc(
    "record_decision",
    {
      application_id: app,
      expected_revision: 2,
      body: "committee",
      decision: "invite",
      reference: "ACTA-TEST",
      rationale: "Invitación documentada",
      invitation_deadline: "2099-01-01",
    },
    "committee",
  );
  const state = (
    await as("applicant", () =>
      db.query(
        "select stage,status,approved_at from public.applications where id=$1",
        [app],
      ),
    )
  ).rows[0];
  assert.equal(state.stage, 2);
  assert.equal(state.status, "selected_for_phase2");
  assert.equal(state.approved_at, null);
});
test("reports deny applicants and distinguish received/invited/approved/signed", async () => {
  await assert.rejects(
    rpc("call_report", { requested_call: call }),
    /GLF_FORBIDDEN/,
  );
  const report = await rpc("call_report", { requested_call: call }, "grants");
  assert.equal(report.received, 1);
  assert.equal(report.invited, 1);
  assert.equal(report.approved, 0);
  assert.equal(report.signed, 0);
  assert.equal(report.signed_total, 0);
});

test("staff without a second factor cannot read applications or mutate calls", async () => {
  await as("grants", async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    assert.equal(
      (await db.query("select * from public.applications")).rows.length,
      0,
    );
  });
  await assert.rejects(
    as("grants", async () => {
      await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
      return db.query("select public.publish_call($1)", [call]);
    }),
    /GLF_FORBIDDEN/,
  );
});

test("phase two drafts do not affect submitted report totals", async () => {
  await assert.rejects(
    db.query("select private.validate_payload($1,$2,true,2)", [payload, rules]),
    /GLF_REQUIRED:residual_probability/,
  );
  const phase2 = structuredClone(fullPayload);
  phase2.concept.requested_amount = 60000;
  phase2.phase2.proposal = "Proyecto completo de prueba";
  assert.equal(
    await rpc("save_application", {
      application_id: app,
      expected_revision: 3,
      payload: phase2,
    }),
    4,
  );
  const report = await rpc("call_report", { requested_call: call }, "grants");
  assert.equal(report.requested_total, 50000);
  assert.equal(
    await rpc("submit_application", {
      application_id: app,
      expected_revision: 4,
    }),
    5,
  );
});

test("corrections require resubmission even after the correction window expires", async () => {
  await rpc(
    "reopen_application",
    {
      application_id: app,
      deadline: "2098-01-01",
      reason: "Aclaración de prueba",
    },
    "grants",
  );
  await db.query(
    "update public.applications set correction_deadline=now()-interval '1 day' where id=$1",
    [app],
  );
  await assert.rejects(
    rpc(
      "record_review",
      {
        application_id: app,
        expected_revision: 6,
        review_type: "safeguards",
        findings: "Test",
        recommendation: "Test",
      },
      "reviewer",
    ),
    /GLF_RESUBMISSION_REQUIRED/,
  );
  await assert.rejects(
    rpc(
      "record_decision",
      {
        application_id: app,
        expected_revision: 6,
        body: "committee",
        decision: "approve",
        reference: "Test",
        rationale: "Test",
        approved_amount: 55000,
      },
      "committee",
    ),
    /GLF_RESUBMISSION_REQUIRED/,
  );
  await rpc(
    "reopen_application",
    {
      application_id: app,
      deadline: "2098-01-01",
      reason: "Nuevo plazo de prueba",
    },
    "grants",
  );
  const updated = structuredClone(fullPayload);
  updated.phase2.proposal = "Propuesta final";
  await rpc("save_application", {
    application_id: app,
    expected_revision: 7,
    payload: updated,
  });
  await rpc("submit_application", {
    application_id: app,
    expected_revision: 8,
  });
});

test("phase two approval needs its own review and an explicit approved amount", async () => {
  const decision = {
    application_id: app,
    expected_revision: 9,
    body: "council",
    decision: "approve",
    reference: "ACTA-FINAL",
    rationale: "Aprobación de prueba",
  };
  await assert.rejects(
    rpc(
      "record_decision",
      { ...decision, approved_amount: 45000 },
      "committee",
    ),
    /GLF_TECHNICAL_REVIEW_REQUIRED/,
  );
  await rpc(
    "record_review",
    {
      application_id: app,
      expected_revision: 9,
      review_type: "safeguards",
      findings: "Revisión final",
      recommendation: "Continuar",
    },
    "reviewer",
  );
  await assert.rejects(
    rpc("record_decision", decision, "committee"),
    /GLF_APPROVED_AMOUNT_REQUIRED/,
  );
  await rpc(
    "record_decision",
    { ...decision, approved_amount: 45000 },
    "committee",
  );
  const report = await rpc("call_report", { requested_call: call }, "grants");
  assert.equal(report.approved, 1);
  assert.equal(report.approved_total, 45000);
  assert.equal(report.signed, 0);
});

test("signed agreements cannot exceed the approved amount", async () => {
  const object = app + "/" + ids.grants + "/agreement/fixture.pdf";
  await as("grants", () =>
    db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,$2)",
      [object, { size: 100 }],
    ),
  );
  const doc = await rpc(
    "register_document",
    {
      app_id: app,
      object_path: object,
      original_name: "fixture.pdf",
      mime: "application/pdf",
      bytes: 100,
      checksum: "a".repeat(64),
      document_kind: "agreement",
    },
    "grants",
  );
  const date = new Date().toISOString().slice(0, 10);
  const agreement = {
    app_id: app,
    expected_revision: 10,
    document_id: doc,
    reference: "CONVENIO-TEST",
    amount: 46000,
    cofinance: 0,
    glf_date: date,
    applicant_date: date,
  };
  await assert.rejects(
    rpc("record_agreement", agreement, "grants"),
    /GLF_AGREEMENT_EXCEEDS_APPROVAL/,
  );
  await rpc("record_agreement", { ...agreement, amount: 44000 }, "grants");
  const report = await rpc("call_report", { requested_call: call }, "grants");
  assert.equal(report.signed, 1);
  assert.equal(report.signed_total, 44000);
  assert.equal(report.approved_total, 45000);
});
