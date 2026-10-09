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
test("browser roles cannot truncate or directly modify prepared documents", async () => {
  for (const role of ["anon", "authenticated"]) {
    for (const privilege of [
      "TRUNCATE",
      "INSERT",
      "UPDATE",
      "DELETE",
      "TRIGGER",
      "REFERENCES",
    ]) {
      const result = await db.query(
        "select has_table_privilege($1, 'public.prepared_documents', $2) as allowed",
        [role, privilege],
      );
      assert.equal(result.rows[0].allowed, false, `${role}: ${privilege}`);
    }
  }
});
test("staff invitation drafts do not create accounts and respect delegated scope", async () => {
  const proposal = {
    contact_email: "test.staff@example.org",
    contact_name: "Test Staff",
    desired_role: "project_coordinator",
    desired_scope: "none",
  };
  const beforeCount = (
    await db.query("select count(*)::int as n from auth.users")
  ).rows[0].n;
  await assert.rejects(
    rpc("prepare_staff_invitation", proposal, "applicant"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc("prepare_staff_invitation", proposal, "coordinator"),
    /GLF_FORBIDDEN/,
  );
  await rpc("prepare_staff_invitation", proposal, "admin");
  assert.equal(
    (await db.query("select count(*)::int as n from auth.users")).rows[0].n,
    beforeCount,
  );
  assert.equal(
    (
      await as("applicant", () =>
        db.query("select * from public.staff_invitation_drafts"),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    as("admin", () =>
      db.query(
        "update public.staff_invitation_drafts set full_name='Tampered'",
      ),
    ),
    /permission denied/,
  );
  await rpc(
    "set_user_admin_scope",
    { target_user: ids.reviewer, scope: "sustainability" },
    "admin",
  );
  await assert.rejects(
    rpc("prepare_staff_invitation", proposal, "reviewer"),
    /GLF_FORBIDDEN/,
  );
  await rpc(
    "prepare_staff_invitation",
    {
      ...proposal,
      contact_email: "sustainability.staff@example.org",
      desired_role: "sustainability_reviewer",
    },
    "reviewer",
  );
  assert.equal(
    (
      await as("reviewer", () =>
        db.query("select * from public.staff_invitation_drafts"),
      )
    ).rows.length,
    1,
  );
  await assert.rejects(
    rpc(
      "prepare_staff_invitation",
      { ...proposal, desired_scope: "projects" },
      "admin",
    ),
    /GLF_INVALID_INVITATION/,
  );
  await rpc(
    "set_user_admin_scope",
    { target_user: ids.reviewer, scope: "none" },
    "admin",
  );
  const events = await db.query(
    "select * from private.user_scope_events where target_id=$1",
    [ids.reviewer],
  );
  assert.ok(
    events.rows.some(
      (e) =>
        e.previous_scope === "sustainability" && e.assigned_scope === "none",
    ),
  );
});
test("staff invitation delivery is privileged and activation requires the correct verified recipient", async () => {
  await assert.rejects(
    rpc(
      "prepare_staff_invitation",
      {
        contact_email: "admin@example.test",
        contact_name: "Existing Admin",
        desired_role: "administrator",
      },
      "admin",
    ),
    /GLF_ACCOUNT_EXISTS/,
  );
  const id = await rpc(
    "prepare_staff_invitation",
    {
      contact_email: "activation@glf.org.ec",
      contact_name: "Activation Test",
      desired_role: "project_coordinator",
    },
    "admin",
  );
  const row = () =>
    db
      .query("select * from public.staff_invitation_drafts where id=$1", [id])
      .then((r) => r.rows[0]);
  const initial = await row();
  await assert.rejects(
    rpc(
      "begin_staff_invitation",
      { invitation_id: id, expected_updated_at: initial.updated_at },
      "applicant",
    ),
    /GLF_FORBIDDEN/,
  );
  const claim = await rpc(
    "begin_staff_invitation",
    { invitation_id: id, expected_updated_at: initial.updated_at },
    "admin",
  );
  await assert.rejects(
    rpc(
      "begin_staff_invitation",
      { invitation_id: id, expected_updated_at: initial.updated_at },
      "admin",
    ),
    /GLF_VERSION_CONFLICT|GLF_INVITATION_WAIT/,
  );
  const recipient = "00000000-0000-4000-8000-000000000099";
  await db.query(
    "insert into auth.users(id,email,invited_at,raw_user_meta_data) values($1,$2,now(),$3)",
    [
      recipient,
      initial.email,
      {
        full_name: "Activation Test",
        role: "administrator",
        glf_invitation_id: id,
      },
    ],
  );
  const profileBefore = (
    await db.query("select * from public.profiles where id=$1", [recipient])
  ).rows[0];
  assert.equal(profileBefore.active, false);
  assert.equal(profileBefore.role, "applicant");
  await assert.rejects(
    rpc(
      "finish_staff_invitation",
      { invitation_id: id, attempt: claim.attempt_id, recipient_id: recipient },
      "admin",
    ),
    /permission denied/,
  );
  await db.query("select public.finish_staff_invitation($1,$2,$3)", [
    id,
    claim.attempt_id,
    recipient,
  ]);
  assert.equal((await row()).status, "sent");
  await assert.rejects(
    rpc("accept_staff_invitation", { invitation_id: id }, "other"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc("get_staff_activation", { invitation_id: id }, "other"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc("accept_staff_invitation", { invitation_id: id }, recipient),
    /GLF_INVITATION_RECIPIENT/,
  );
  await db.query(
    "update auth.users set email_confirmed_at=now(),encrypted_password='test-only-hash' where id=$1",
    [recipient],
  );
  await rpc("accept_staff_invitation", { invitation_id: id }, recipient);
  const activated = (
    await db.query("select * from public.profiles where id=$1", [recipient])
  ).rows[0];
  assert.equal(activated.active, true);
  assert.equal(activated.role, "project_coordinator");
  assert.equal((await row()).status, "accepted");
  await assert.rejects(
    rpc("accept_staff_invitation", { invitation_id: id }, recipient),
    /GLF_INVITATION_EXPIRED/,
  );
  await as(recipient, async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    assert.equal(
      (await db.query("select private.current_role() as role")).rows[0].role,
      null,
    );
    assert.equal(
      (await db.query("select * from public.applications")).rows.length,
      0,
    );
  });
  assert.ok(
    (
      await db.query(
        "select * from private.staff_invitation_events where invitation_id=$1",
        [id],
      )
    ).rows.some((e) => e.event_type === "accepted"),
  );
});
test("cancelled and expired staff invitations cannot activate accounts or change sent permissions", async () => {
  for (const state of ["cancelled", "expired"]) {
    const id = await rpc(
      "prepare_staff_invitation",
      {
        contact_email: `${state}@glf.org.ec`,
        contact_name: "Boundary Test",
        desired_role: "sustainability_reviewer",
      },
      "admin",
    );
    const row = () =>
      db
        .query("select * from public.staff_invitation_drafts where id=$1", [id])
        .then((r) => r.rows[0]);
    const initial = await row();
    const claim = await rpc(
      "begin_staff_invitation",
      { invitation_id: id, expected_updated_at: initial.updated_at },
      "admin",
    );
    const recipient =
      state === "cancelled"
        ? "00000000-0000-4000-8000-000000000098"
        : "00000000-0000-4000-8000-000000000097";
    await db.query(
      "insert into auth.users(id,email,invited_at,email_confirmed_at,encrypted_password) values($1,$2,now(),now(),'test-only-hash')",
      [recipient, initial.email],
    );
    await db.query("select public.finish_staff_invitation($1,$2,$3)", [
      id,
      claim.attempt_id,
      recipient,
    ]);
    await assert.rejects(
      rpc(
        "prepare_staff_invitation",
        {
          contact_email: initial.email,
          contact_name: "Changed Test",
          desired_role: "administrator",
        },
        "admin",
      ),
      /GLF_INVITATION_LOCKED/,
    );
    if (state === "cancelled")
      await rpc(
        "cancel_staff_invitation",
        { invitation_id: id, expected_updated_at: (await row()).updated_at },
        "admin",
      );
    else
      await db.query(
        "update public.staff_invitation_drafts set expires_at=now()-interval '1 second' where id=$1",
        [id],
      );
    await assert.rejects(
      rpc("accept_staff_invitation", { invitation_id: id }, recipient),
      /GLF_INVITATION_EXPIRED/,
    );
    assert.equal(
      (
        await db.query("select active from public.profiles where id=$1", [
          recipient,
        ])
      ).rows[0].active,
      false,
    );
  }
});
test("corpus import requires administrator and preserves pending approval and versions", async () => {
  const item = {
    document_name: "Test source",
    document_version: "test-v1",
    locator: "page 1",
    content: "Test normative evidence",
    source_kind: "official",
    embedding: Array(384).fill(0.05),
  };
  await assert.rejects(
    rpc("import_evidence", { items: JSON.stringify([item]) }, "applicant"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc("import_evidence", { items: JSON.stringify([item]) }, "reviewer"),
    /GLF_FORBIDDEN/,
  );
  assert.equal(
    await rpc("import_evidence", { items: JSON.stringify([item]) }, "admin"),
    1,
  );
  assert.equal(
    await rpc("import_evidence", { items: JSON.stringify([item]) }, "admin"),
    0,
  );
  await assert.rejects(
    rpc(
      "import_evidence",
      { items: JSON.stringify([{ ...item, content: "changed" }]) },
      "admin",
    ),
    /GLF_CORPUS_VERSION_CONFLICT/,
  );
  const hidden = await as("reviewer", () =>
    db.query(
      "select * from public.knowledge_chunks where document_name='Test source'",
    ),
  );
  assert.equal(hidden.rows.length, 0);
  const visible = await as("admin", () =>
    db.query(
      "select * from public.knowledge_chunks where document_name='Test source'",
    ),
  );
  assert.equal(visible.rows[0].approved, false);
});
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
 create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',invited_at timestamptz,email_confirmed_at timestamptz,encrypted_password text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('request.jwt.claim.aal',true),''),'aal2'))$$;
 grant usage on schema auth,storage,public to anon,authenticated,service_role;
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
        description_es: "Convocatoria de prueba",
        description_en: "Test description",
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
test("database validates structured alignment and rejects forged references and missing contribution", async () => {
  const p = {
    concept: {
      strategic_alignment: {
        version: "pg2030-anexo6-glf2024-ods2015-v1",
        objectives: [
          {
            id: "30000000-0000-4000-8000-000000000001",
            kind: "general",
            text: "",
            plan: ["E1"],
            ods: [14],
            glf: ["GLF-L07"],
            contribution: "",
          },
        ],
      },
    },
    activities: [],
  };
  const validate = (value) =>
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,false,1)", [
      JSON.stringify(value),
      JSON.stringify(rules),
    ]);
  await validate(p);
  for (const patch of [
    { plan: ["FAKE"] },
    { ods: [18] },
    { ods: [14, 14] },
    { glf: ["GLF-L99"] },
  ]) {
    const bad = structuredClone(p);
    Object.assign(bad.concept.strategic_alignment.objectives[0], patch);
    await assert.rejects(validate(bad), /GLF_INVALID_ALIGNMENT/);
  }
  const badActivity = structuredClone(p);
  badActivity.activities = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      risks: [],
      objective_ids: ["30000000-0000-4000-8000-000000000001"],
    },
  ];
  await assert.rejects(validate(badActivity), /GLF_INVALID_ALIGNMENT/);
  const completePayload = structuredClone(fullPayload);
  completePayload.concept.strategic_alignment = structuredClone(
    p.concept.strategic_alignment,
  );
  completePayload.concept.strategic_alignment.objectives[0].text =
    "Conservar hábitats";
  completePayload.concept.strategic_alignment.objectives.push({
    ...completePayload.concept.strategic_alignment.objectives[0],
    id: "30000000-0000-4000-8000-000000000002",
    kind: "specific",
  });
  await assert.rejects(
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,true,2)", [
      JSON.stringify(completePayload),
      JSON.stringify(rules),
    ]),
    /GLF_ALIGNMENT_REQUIRED/,
  );
  completePayload.concept.strategic_alignment.objectives.forEach(
    (o) => (o.contribution = "Restaurar zonas degradadas"),
  );
  await db.query(
    "select private.validate_payload($1::jsonb,$2::jsonb,true,2)",
    [JSON.stringify(completePayload), JSON.stringify(rules)],
  );
});
test("one applicant can keep multiple independent applications in the same call", async () => {
  const first = await rpc("create_application", { call_id: call });
  const second = await rpc("create_application", { call_id: call });
  assert.notEqual(first, second);
  const firstPayload = {
    concept: { title: "First independent project" },
    activities: [],
    phase2: {},
  };
  const secondPayload = {
    concept: { title: "Second independent project" },
    activities: [],
    phase2: {},
  };
  await rpc("save_application", {
    application_id: first,
    expected_revision: 0,
    payload: JSON.stringify(firstPayload),
  });
  await rpc("save_application", {
    application_id: second,
    expected_revision: 0,
    payload: JSON.stringify(secondPayload),
  });
  const result = await as("applicant", () =>
    db.query(
      "select id,reference_code,payload from public.applications where id in ($1,$2)",
      [first, second],
    ),
  );
  assert.equal(result.rows.length, 2);
  assert.equal(new Set(result.rows.map((row) => row.reference_code)).size, 2);
  assert.equal(
    result.rows.find((row) => row.id === first).payload.concept.title,
    firstPayload.concept.title,
  );
  assert.equal(
    result.rows.find((row) => row.id === second).payload.concept.title,
    secondPayload.concept.title,
  );
  assert.equal(
    (
      await as("other", () =>
        db.query("select id from public.applications where id in ($1,$2)", [
          first,
          second,
        ]),
      )
    ).rows.length,
    0,
  );
});
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
    phone: "+593991234567",
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
test("database blocks malformed phones when completing an application", async () => {
  for (const phone of ["123456789", "+593" + "9".repeat(30), "contact me"]) {
    const invalid = structuredClone(payload);
    invalid.concept.phone = phone;
    await assert.rejects(
      db.query("select private.validate_payload($1::jsonb,$2::jsonb,true,1)", [
        JSON.stringify(invalid),
        JSON.stringify(rules),
      ]),
      /GLF_INVALID_PHONE/,
    );
  }
  await db.query(
    "select private.validate_payload($1::jsonb,$2::jsonb,true,1)",
    [JSON.stringify(payload), JSON.stringify(rules)],
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
  await assert.rejects(
    rpc("submit_application", { application_id: app, expected_revision: 1 }),
    /GLF_PREPARE_DOCUMENTS_REQUIRED/,
  );
  const prepared = await rpc("prepare_application_documents", {
    app_id: app,
    expected_revision: 1,
  });
  assert.ok(prepared);
  await assert.rejects(
    rpc(
      "prepare_application_documents",
      { app_id: app, expected_revision: 1 },
      "other",
    ),
    /GLF_APPLICATION_LOCKED/,
  );
  await assert.rejects(
    rpc("submit_application", { application_id: app, expected_revision: 1 }),
    /GLF_SIGNED_CONCEPT_REQUIRED/,
  );
  await db.query(
    "insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by) values($1,'concept_signed','test/signed.pdf','signed.pdf','application/pdf',100,$2,$3)",
    [app, "a".repeat(64), ids.applicant],
  );
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
  const date = (await db.query("select current_date::text as date")).rows[0]
    .date;
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

test("area administration is delegated independently of technical roles", async () => {
  await assert.rejects(
    rpc(
      "assign_staff_role",
      { target_user: ids.other, assigned_role: "sustainability_reviewer" },
      "reviewer",
    ),
    /GLF_FORBIDDEN/,
  );
  await rpc(
    "set_user_admin_scope",
    { target_user: ids.reviewer, scope: "sustainability" },
    "admin",
  );
  await assert.rejects(
    rpc(
      "assign_staff_role",
      { target_user: ids.other, assigned_role: "administrator" },
      "reviewer",
    ),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc(
      "assign_staff_role",
      { target_user: ids.grants, assigned_role: "sustainability_reviewer" },
      "reviewer",
    ),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    rpc(
      "set_user_admin_scope",
      { target_user: ids.other, scope: "sustainability" },
      "reviewer",
    ),
    /GLF_FORBIDDEN/,
  );
  await rpc(
    "assign_staff_role",
    { target_user: ids.other, assigned_role: "sustainability_reviewer" },
    "reviewer",
  );
  const other = await as("other", () =>
    db.query("select id from public.profiles"),
  );
  assert.equal(other.rows.length, 1);
  await rpc(
    "assign_staff_role",
    { target_user: ids.other, assigned_role: "applicant" },
    "admin",
  );
});
test("call drafts preserve incomplete content, reject stale edits and require complete reviewed publication", async () => {
  const details = {
    code: "DRAFT-REVIEW-TEST",
    title_es: "",
    title_en: "",
    description_es: "",
    description_en: "",
    rules_version: "",
    opens_at: null,
    closes_at: null,
    rules: { ...rules, applicant_types: [], privacy_es: "", privacy_en: "" },
    phase2_schema: [],
  };
  await assert.rejects(
    rpc("save_call_draft", { details }, "applicant"),
    /GLF_FORBIDDEN/,
  );
  let draft = await rpc("save_call_draft", { details }, "grants");
  assert.equal(draft.status, "draft");
  assert.equal(draft.opens_at, null);
  assert.equal(
    (
      await as("applicant", () =>
        db.query("select id from public.calls where id=$1", [draft.id]),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    rpc(
      "publish_call_reviewed",
      { call_id: draft.id, expected_revision: draft.revision },
      "grants",
    ),
    /GLF_INVALID_CALL_STATE/,
  );
  const complete = {
    ...details,
    title_es: "Convocatoria prueba interna",
    title_en: "Internal test call",
    description_es: "Descripción de prueba",
    description_en: "Test description",
    rules_version: "1.0",
    opens_at: "2020-01-01T00:00:00Z",
    closes_at: "2099-01-01T00:00:00Z",
    rules,
  };
  await assert.rejects(
    rpc("save_call_draft", { details: complete }, "grants"),
    /duplicate key value violates unique constraint/,
  );
  const oldRevision = draft.revision;
  draft = await rpc(
    "save_call_draft",
    { details: complete, call_id: draft.id, expected_revision: oldRevision },
    "grants",
  );
  await assert.rejects(
    rpc(
      "save_call_draft",
      { details: complete, call_id: draft.id, expected_revision: oldRevision },
      "grants",
    ),
    /GLF_REVISION_CONFLICT/,
  );
  await assert.rejects(
    rpc(
      "publish_call_reviewed",
      { call_id: draft.id, expected_revision: oldRevision },
      "grants",
    ),
    /GLF_REVISION_CONFLICT/,
  );
  await assert.rejects(
    rpc(
      "publish_call_reviewed",
      { call_id: draft.id, expected_revision: draft.revision },
      "coordinator",
    ),
    /GLF_FORBIDDEN/,
  );
  const published = await rpc(
    "publish_call_reviewed",
    { call_id: draft.id, expected_revision: draft.revision },
    "grants",
  );
  assert.equal(published.status, "published");
  await assert.rejects(
    rpc(
      "save_call_draft",
      {
        details: complete,
        call_id: draft.id,
        expected_revision: published.revision,
      },
      "grants",
    ),
    /GLF_INVALID_CALL_STATE/,
  );
  assert.equal(
    (
      await db.query(
        "select event_type from private.call_events where call_id=$1",
        [draft.id],
      )
    ).rows.length,
    3,
  );
  const missing = await rpc(
    "save_call_draft",
    {
      details: {
        ...complete,
        code: "DRAFT-MISSING-CONTENT",
        description_en: "",
      },
    },
    "grants",
  );
  await assert.rejects(
    rpc("publish_call", { call_id: missing.id }, "grants"),
    /GLF_CALL_CONTENT_REQUIRED/,
  );
  await assert.rejects(
    as("grants", () =>
      db.query("select public.publish_call_rules($1)", [missing.id]),
    ),
    /permission denied/,
  );
});
