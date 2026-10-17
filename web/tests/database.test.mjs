import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
const db = new PGlite({ extensions: { vector } });
let currentPayloadValidator;
const ids = {
  applicant: "00000000-0000-4000-8000-000000000001",
  other: "00000000-0000-4000-8000-000000000002",
  grants: "00000000-0000-4000-8000-000000000003",
  reviewer: "00000000-0000-4000-8000-000000000004",
  coordinator: "00000000-0000-4000-8000-000000000005",
  committee: "00000000-0000-4000-8000-000000000006",
  admin: "00000000-0000-4000-8000-000000000007",
};
test("submission core repair restores a missing dependency without exposing a bypass RPC", async () => {
  currentPayloadValidator = (await db.query("select pg_get_functiondef('private.validate_payload(jsonb,jsonb,boolean,integer)'::regprocedure) as definition")).rows[0].definition;
  const currentCore = (await db.query("select pg_get_functiondef('public.submit_application_core(uuid,integer)'::regprocedure) as definition")).rows[0].definition;
  await db.exec("drop function public.submit_application_core(uuid,integer)");
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610110026_restore_submission_core.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const role of ["anon", "authenticated"]) {
    const result = await db.query(
      "select has_function_privilege($1,'public.submit_application_core(uuid,integer)','EXECUTE') as allowed",
      [role],
    );
    assert.equal(result.rows[0].allowed, false);
  }
  await db.exec(currentCore);
});
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
  themes: [{ id: "research", label_es: "Investigación", label_en: "Research" }],
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
async function temporaryAccount(academic = false) {
  const id = crypto.randomUUID();
  await db.query(
    "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
    [
      id,
      `${id}@example.test`,
      { full_name: "Account QA", glf_academic_provision: "true" },
    ],
  );
  if (academic)
    await db.query("select public.finish_academic_account($1,$2)", [
      id,
      ids.admin,
    ]);
  return id;
}
async function accountOperation(
  id,
  operation,
  user = "admin",
  reason = "Account QA",
) {
  const {
    rows: [p],
  } = await db.query(
    "select account_revision from public.profiles where id=$1",
    [id],
  );
  return rpc(
    "manage_account",
    {
      target_user: id,
      expected_revision: p.account_revision,
      operation,
      reason,
    },
    user,
  );
}
test("academic account expires after three months, is not staff and cannot access institutional data", async () => {
  const id = await temporaryAccount(true);
  const {
    rows: [p],
  } = await db.query(
    "select access_expires_at > now()+interval '89 days' and access_expires_at <= now()+interval '3 months' as valid from public.profiles where id=$1",
    [id],
  );
  assert.equal(p.valid, true);
  await as(id, async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    assert.equal(
      (await db.query("select public.access_session_valid() as valid")).rows[0]
        .valid,
      true,
    );
    assert.equal(
      (await db.query("select private.current_role() as role")).rows[0].role,
      null,
    );
    assert.equal(
      (await db.query("select private.is_staff() as staff")).rows[0].staff,
      false,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from public.applications"))
        .rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.application_versions",
        )
      ).rows[0].n,
      0,
    );
  });
  await assert.rejects(
    rpc("create_application", { call_id: call }, id),
    /GLF_FORBIDDEN|GLF_INVALID_CALL/,
  );
  await assert.rejects(rpc("list_managed_accounts", {}, id), /GLF_FORBIDDEN/);
  await assert.rejects(
    rpc(
      "assign_staff_role",
      { target_user: id, assigned_role: "administrator" },
      "admin",
    ),
    /academic_profile/,
  );
  await db.query(
    "update public.profiles set access_expires_at=now()-interval '1 second' where id=$1",
    [id],
  );
  assert.equal(await rpc("access_session_valid", {}, id), false);
  await accountOperation(id, "deactivate");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from auth.sessions where user_id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
  await assert.rejects(
    accountOperation(id, "reactivate"),
    /GLF_CANNOT_REACTIVATE/,
  );
});
test("academic RAG accesses only approved normative sources and has a shared enforced quota", async () => {
  const id = await temporaryAccount(true),
    embedding = Array(384).fill(0);
  embedding[0] = 1;
  await db.query(
    "insert into public.knowledge_chunks(document_name,document_version,locator,content,approved,source_kind,embedding) values ('Academic official QA','1','p1','Official normative evidence',true,'official',$1),('Academic private QA','1','p1','Internal evidence',true,'unclassified',$1)",
    [JSON.stringify(embedding)],
  );
  await db.query(
    "insert into private.academic_sources values('Academic official QA','1')",
  );
  const results = await as(id, async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    return (
      await db.query("select * from public.match_evidence($1,20)", [
        JSON.stringify(embedding),
      ])
    ).rows;
  });
  assert.ok(results.some((r) => r.document_name === "Academic official QA"));
  assert.ok(!results.some((r) => r.document_name === "Academic private QA"));
  for (let i = 0; i < 15; i++)
    assert.equal(await rpc("consume_academic_query", {}, id), true);
  assert.equal(await rpc("consume_academic_query", {}, id), false);
  await accountOperation(id, "deactivate");
  await assert.rejects(rpc("consume_academic_query", {}, id), /GLF_FORBIDDEN/);
  await assert.rejects(
    rpc("match_evidence", { query_embedding: JSON.stringify(embedding) }, id),
    /GLF_FORBIDDEN/,
  );
});
test("account suspension preserves history, enforces scope and blocks old sessions after reactivation", async () => {
  const id = await temporaryAccount(),
    old = crypto.randomUUID(),
    fresh = crypto.randomUUID();
  await db.query(
    "insert into auth.sessions(id,user_id,created_at) values($1,$2,now()-interval '1 day')",
    [old, id],
  );
  await assert.rejects(
    accountOperation(id, "deactivate", "applicant"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    accountOperation(id, "deactivate", "grants"),
    /GLF_FORBIDDEN/,
  );
  await assert.rejects(
    accountOperation(ids.admin, "deactivate"),
    /GLF_SELF_ACCOUNT_CHANGE/,
  );
  await assert.rejects(accountOperation(id, "archive"), /GLF_DEACTIVATE_FIRST/);
  await accountOperation(id, "deactivate");
  assert.equal(await rpc("access_session_valid", {}, id), false);
  await accountOperation(id, "reactivate");
  assert.equal(await rpc("access_session_valid", {}, id), false);
  await db.query(
    "insert into auth.sessions(id,user_id,created_at) values($1,$2,clock_timestamp()+interval '1 second')",
    [fresh, id],
  );
  await as(id, async () => {
    await db.query(
      "select set_config('request.jwt.claim.session_id',$1,true)",
      [old],
    );
    assert.equal(
      (await db.query("select public.access_session_valid() as valid")).rows[0]
        .valid,
      false,
    );
    await db.query(
      "select set_config('request.jwt.claim.session_id',$1,true)",
      [fresh],
    );
    assert.equal(
      (await db.query("select public.access_session_valid() as valid")).rows[0]
        .valid,
      true,
    );
  });
  await accountOperation(id, "revoke_sessions");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from auth.sessions where user_id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await db.query(
        "select has_function_privilege('authenticated','private.manage_account_core(uuid,integer,text,text)','EXECUTE') as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await as(id, async () => {
    await db.query(
      "select set_config('request.jwt.claim.session_id',$1,true)",
      [old],
    );
    assert.equal(
      (await db.query("select private.current_role() as role")).rows[0].role,
      null,
    );
  });
  await assert.rejects(
    rpc(
      "manage_account",
      {
        target_user: id,
        expected_revision: 0,
        operation: "deactivate",
        reason: "Stale client",
      },
      "admin",
    ),
    /GLF_CONCURRENT_CHANGE/,
  );
});
test("academic access reads shared test applications and files but not future applications or writes", async () => {
  const id = await temporaryAccount(true);
  const owner = await temporaryAccount();
  const app = await rpc("create_application", { call_id: call }, owner);
  await db.query(
    "insert into private.academic_application_scope values($1) on conflict do nothing",
    [app],
  );
  const future = await rpc("create_application", { call_id: call }, owner);
  const path = `${app}/academic-read.pdf`;
  await db.query(
    "insert into storage.objects(bucket_id,name) values('application-files',$1)",
    [path],
  );
  await db.query(
    "insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by) values($1,'other',$2,'academic-read.pdf','application/pdf',10,$3,$4)",
    [app, path, "a".repeat(64), owner],
  );
  await as(id, async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.applications where id=$1",
          [app],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.applications where id=$1",
          [future],
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.application_documents where storage_path=$1",
          [path],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from storage.objects where name=$1",
          [path],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query("select private.can_edit_application($1) as allowed", [
          app,
        ])
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (await db.query("select private.current_role() as role")).rows[0].role,
      null,
    );
  });
  assert.ok(await rpc("academic_call_report", { requested_call: call }, id));
  await assert.rejects(
    rpc(
      "save_application",
      { application_id: app, expected_revision: 0, payload },
      id,
    ),
    /GLF_FORBIDDEN|GLF_APPLICATION_LOCKED/,
  );
  await accountOperation(id, "deactivate");
  await as(id, async () =>
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.application_documents where storage_path=$1",
          [path],
        )
      ).rows[0].n,
      0,
    ),
  );
});
test("permanent deletion requires inactive archived account without history and removes auth identity atomically", async () => {
  const id = await temporaryAccount();
  await assert.rejects(
    db.query("delete from auth.users where id=$1", [id]),
    /GLF_ACCOUNT_DELETE_FORBIDDEN/,
  );
  await accountOperation(id, "deactivate");
  await accountOperation(id, "archive");
  await as("admin", async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    await assert.rejects(
      db.query("select public.prepare_account_deletion($1,2,'QA')", [id]),
      /GLF_FORBIDDEN/,
    );
  });
  // The rejected nested transaction above rolls back its error before the next action.
  const revision = (
    await db.query("select account_revision from public.profiles where id=$1", [
      id,
    ])
  ).rows[0].account_revision;
  await rpc(
    "prepare_account_deletion",
    {
      target_user: id,
      expected_revision: revision,
      reason: "Remove unused account",
    },
    "admin",
  );
  await db.query("delete from auth.users where id=$1", [id]);
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.profiles where id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
  assert.equal(await rpc("access_session_valid", {}, id), false);
  assert.ok(
    (
      await db.query(
        "select count(*)::int as n from private.account_events where target_id=$1",
        [id],
      )
    ).rows[0].n >= 3,
  );
});
test("linked applications forbid account deletion, academic creation requires service role and sessions remain MFA-protected", async () => {
  const id = await temporaryAccount();
  await rpc("create_application", { call_id: call }, id);
  await accountOperation(id, "deactivate");
  await accountOperation(id, "archive");
  const revision = (
    await db.query("select account_revision from public.profiles where id=$1", [
      id,
    ])
  ).rows[0].account_revision;
  await assert.rejects(
    rpc(
      "prepare_account_deletion",
      {
        target_user: id,
        expected_revision: revision,
        reason: "Cannot remove linked account",
      },
      "admin",
    ),
    /GLF_ACCOUNT_HAS_HISTORY/,
  );
  await assert.rejects(
    rpc(
      "finish_academic_account",
      { target_user: id, actor: ids.admin },
      "admin",
    ),
    /permission denied/,
  );
  await as("reviewer", async () => {
    await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
    assert.equal(
      (await db.query("select private.current_role() as role")).rows[0].role,
      null,
    );
  });
});
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
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now());
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('request.jwt.claim.aal',true),''),'aal2'),'session_id',nullif(current_setting('request.jwt.claim.session_id',true),''))$$;
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

test("draft deletion requires ownership and an unchanged revision; files must be removed before finalization", async () => {
  const id = await rpc("create_application", { call_id: call });
  await assert.rejects(
    rpc("begin_delete_draft", { app_id: id, expected_revision: 0 }, "other"),
    /GLF_DELETE_FORBIDDEN/,
  );
  await assert.rejects(
    rpc("begin_delete_draft", { app_id: id, expected_revision: 9 }),
    /GLF_REVISION_CONFLICT/,
  );
  const path = id + "/" + ids.applicant + "/attachment/test.pdf";
  await db.query(
    "insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,'{}')",
    [path],
  );
  assert.deepEqual(
    await rpc("begin_delete_draft", { app_id: id, expected_revision: 0 }),
    [path],
  );
  await assert.rejects(
    rpc("save_application", {
      application_id: id,
      expected_revision: 0,
      payload,
    }),
    /GLF_APPLICATION_LOCKED/,
  );
  await assert.rejects(
    rpc("finish_delete_draft", { app_id: id }),
    /GLF_DELETE_FILES_PENDING/,
  );
  await as("other", () =>
    db.query("delete from storage.objects where name=$1", [path]),
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from storage.objects where name=$1",
        [path],
      )
    ).rows[0].n,
    1,
  );
  await as("applicant", () =>
    db.query("delete from storage.objects where name=$1", [path]),
  );
  await rpc("finish_delete_draft", { app_id: id });
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.applications where id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
});
test("first submission permanently protects an application from deletion", async () => {
  const id = await rpc("create_application", { call_id: call });
  await db.query(
    "update public.applications set submitted_at=now() where id=$1",
    [id],
  );
  await assert.rejects(
    rpc("begin_delete_draft", { app_id: id, expected_revision: 0 }),
    /GLF_SUBMITTED_RECORD_PROTECTED/,
  );
  await assert.rejects(
    db.query("delete from public.applications where id=$1", [id]),
    /GLF_SUBMITTED_RECORD_PROTECTED/,
  );
  // Reset only this synthetic test fixture so later report totals stay isolated.
  await db.query(
    "update public.applications set submitted_at=null where id=$1",
    [id],
  );
  await rpc("begin_delete_draft", { app_id: id, expected_revision: 0 });
  await rpc("finish_delete_draft", { app_id: id });
});
test("database rejects forged and duplicate registered activity risks", async () => {
  const p = structuredClone(fullPayload);
  const id = "40000000-0000-4000-8000-000000000001";
  const r = p.activities[0].risks[0];
  p.concept.risk_register = [{ id, name: r.name, dimension: r.dimension }];
  r.source_id = id;
  await db.query(
    "select private.validate_payload($1::jsonb,$2::jsonb,false,2)",
    [JSON.stringify(p), JSON.stringify(rules)],
  );
  r.source_id = "40000000-0000-4000-8000-000000000099";
  await assert.rejects(
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,false,2)", [
      JSON.stringify(p),
      JSON.stringify(rules),
    ]),
    /GLF_INVALID_RISK_REFERENCE/,
  );
  r.source_id = id;
  p.activities[0].risks.push({
    ...r,
    id: "40000000-0000-4000-8000-000000000002",
  });
  await assert.rejects(
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,false,2)", [
      JSON.stringify(p),
      JSON.stringify(rules),
    ]),
    /GLF_INVALID_RISK_REFERENCE/,
  );
});
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
    province: "Galápagos",
    city: "Puerto Ayora",
    ruc: "2090000000001",
    applicant_name: "Organización de prueba",
    contact_name: "Persona de prueba",
    email: "applicant@example.test",
    phone: "+593991234567",
    address: "Galápagos",
    partners: "",
    location: "Santa Cruz",
    project_type: "research",
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
test("applicant identification and v2 general-only alignment are enforced by database", async () => {
  const validate = (p, complete = true) =>
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,$3,1)", [
      JSON.stringify(p),
      JSON.stringify(rules),
      complete,
    ]);
  const p = structuredClone(payload);
  delete p.concept.ruc;
  await validate(p, false);
  await assert.rejects(validate(p), /GLF_RUC_REQUIRED/);
  p.concept.applicant_type = "individual";
  await assert.rejects(validate(p), /GLF_RESIDENCE_REQUIRED/);
  p.concept.residence_number = "RP-123456";
  await assert.rejects(validate(p), /GLF_IDENTITY_NUMBER_REQUIRED/);
  await validate(p, false);
  for (const value of ["012345678", "01234ABCDE", "01234 6789"]) {
    p.concept.identity_number = value;
    await assert.rejects(validate(p), /GLF_IDENTITY_NUMBER_REQUIRED/);
  }
  p.concept.identity_number = "0123456789";
  await validate(p);
  p.concept.strategic_alignment = {
    version: "pg2030-ods-general-v2",
    objectives: [
      {
        id: "99999999-1000-4000-8000-000000000001",
        kind: "general",
        text: "Conservar ecosistemas",
        plan: ["E1"],
        ods: [14],
        glf: [],
        contribution: "Recuperar el hábitat",
      },
      {
        id: "99999999-1000-4000-8000-000000000002",
        kind: "specific",
        text: "Restaurar manglar",
        plan: [],
        ods: [],
        glf: [],
        contribution: "",
      },
    ],
  };
  await validate(p);
  p.concept.strategic_alignment.objectives[1].plan = ["E1"];
  await assert.rejects(validate(p), /GLF_INVALID_ALIGNMENT/);
  p.concept.strategic_alignment.objectives[1].plan = [];
  p.concept.strategic_alignment.objectives[0].ods = [];
  await assert.rejects(validate(p), /GLF_ALIGNMENT_REQUIRED/);
  const dates = structuredClone(payload);
  dates.concept.end_date = dates.concept.start_date;
  await assert.rejects(validate(dates), /GLF_INVALID_DATES/);
  dates.concept.end_date = "2030-01-01";
  await assert.rejects(validate(dates), /GLF_CATEGORY_DURATION/);
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
test("signed upload registration rejects a version changed and prepared on another device", async () => {
  const concurrentPayload = structuredClone(payload);
  concurrentPayload.activities[0].id = "99999999-0000-4000-8000-000000000001";
  concurrentPayload.activities[0].risks[0].id =
    "99999999-0000-4000-8000-000000000002";
  const target = await rpc("create_application", { call_id: call });
  await rpc("save_application", {
    application_id: target,
    expected_revision: 0,
    payload: concurrentPayload,
  });
  await rpc("prepare_application_documents", {
    app_id: target,
    expected_revision: 1,
  });
  const object = target + "/" + ids.applicant + "/attachment/concurrent.pdf";
  await as("applicant", () =>
    db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,$2)",
      [object, { size: 100 }],
    ),
  );
  const args = {
    app_id: target,
    expected_revision: 1,
    object_path: object,
    original_name: "concurrent.pdf",
    mime: "application/pdf",
    bytes: 100,
    checksum: "a".repeat(64),
    document_kind: "concept_signed",
  };
  await rpc("save_application", {
    application_id: target,
    expected_revision: 1,
    payload: concurrentPayload,
  });
  await rpc("prepare_application_documents", {
    app_id: target,
    expected_revision: 2,
  });
  await assert.rejects(
    rpc("register_signed_document", args),
    /GLF_VERSION_CONFLICT/,
  );
  await assert.rejects(
    rpc("register_signed_document", { ...args, expected_revision: 2 }, "other"),
    /GLF_APPLICATION_LOCKED/,
  );
  await assert.rejects(
    rpc("register_signed_document", {
      ...args,
      expected_revision: 2,
      mime: "image/png",
    }),
    /GLF_SIGNED_DOCUMENT_PDF_REQUIRED/,
  );
  const doc = await rpc("register_signed_document", {
    ...args,
    expected_revision: 2,
  });
  assert.ok(doc);
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.application_documents where application_id=$1",
        [target],
      )
    ).rows[0].n,
    1,
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
  await assert.rejects(
    rpc("submit_application", { application_id: app, expected_revision: 1 }),
    /GLF_SIGNED_MATRIX_REQUIRED/,
  );
  await assert.rejects(
    db.query(
      "insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by) values($1,'matrix_signed','test/wrong.png','wrong.png','image/png',100,$2,$3)",
      [app, "b".repeat(64), ids.applicant],
    ),
    /GLF_SIGNED_DOCUMENT_PDF_REQUIRED/,
  );
  await db.query(
    "insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by,created_at) values($1,'matrix_signed','test/stale.pdf','stale.pdf','application/pdf',100,$2,$3,'2000-01-01')",
    [app, "b".repeat(64), ids.applicant],
  );
  await assert.rejects(
    rpc("submit_application", { application_id: app, expected_revision: 1 }),
    /GLF_SIGNED_MATRIX_REQUIRED/,
  );
  await db.query(
    "insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by) values($1,'matrix_signed','test/matrix.pdf','matrix.pdf','application/pdf',100,$2,$3)",
    [app, "b".repeat(64), ids.applicant],
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

test("RAG support notes require internal MFA access, a submitted risk, and cannot alter decisions", async () => {
  const version = (
    await db.query(
      "select application_id,revision,payload from public.application_versions order by revision desc limit 1",
    )
  ).rows[0];
  assert.ok(version);
  const risk = version.payload.activities.flatMap((a) => a.risks)[0];
  const args = [
    version.application_id,
    version.revision,
    risk.id,
    ids.reviewer,
  ];
  const insert = () =>
    db.query(
      "insert into public.rag_review_notes(application_id,revision,risk_id,method,query,evidence,observation,created_by) values($1,$2,$3,'e5','Marine risk evidence','{}','Review this evidence',$4) returning id",
      args,
    );
  const note = (await as("reviewer", insert)).rows[0];
  assert.ok(note.id);
  assert.equal(
    (
      await as("applicant", () =>
        db.query("select id from public.rag_review_notes"),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(as("applicant", insert), /row-level security/);
  await assert.rejects(as("grants", insert), /row-level security/);
  args[2] = "00000000-0000-4000-8000-000000009999";
  await assert.rejects(as("reviewer", insert), /row-level security/);
  await assert.rejects(
    as("reviewer", () =>
      db.query("delete from public.rag_review_notes where id=$1", [note.id]),
    ),
    /permission denied/,
  );
  assert.equal(
    (
      await as("admin", () =>
        db.query("select id from public.rag_review_notes"),
      )
    ).rows.length,
    1,
  );
});

test("annual detail persists once, uses both sources, validates totals and preserves original summary", async () => {
  const id = await rpc("create_application", { call_id: call }, "other");
  const p = structuredClone(payload);
  p.activities[0].id = crypto.randomUUID();
  p.activities[0].risks[0].id = crypto.randomUUID();
  p.budget = {
    version: "glf-annual-v1",
    currency: "USD",
    years: 1,
    legacy_summary: {
      requested_amount: 123,
      cofinance_amount: 0,
      admin_cost: 0,
    },
    lines: [
      {
        id: "00000000-0000-4000-8000-000000005001",
        year: 1,
        category: "equipment",
        description: "Materiales",
        glf: 1000000,
        other: 10000,
        remuneration: "no",
      },
    ],
  };
  Object.assign(p.concept, {
    requested_amount: 10000,
    cofinance_amount: 100,
    admin_cost: 0,
  });
  await rpc(
    "save_application",
    { application_id: id, expected_revision: 0, payload: p },
    "other",
  );
  const stored = (
    await db.query(
      "select payload,rules_snapshot from public.applications where id=$1",
      [id],
    )
  ).rows[0];
  assert.deepEqual(stored.payload.budget, p.budget);
  assert.equal(stored.rules_snapshot.grant_rule_version, "glf-2025-v1");
  await db.query("select private.validate_payload($1,$2,true,1)", [
    JSON.stringify(p),
    JSON.stringify(rules),
  ]);
  const bad = structuredClone(p);
  bad.budget.lines[0].glf = 1000001;
  await db.query("select private.validate_payload($1,$2,true,1)", [
    JSON.stringify(bad),
    JSON.stringify(rules),
  ]);
  bad.activities = structuredClone(fullPayload.activities);
  await assert.rejects(
    db.query("select private.validate_payload($1,$2,true,2)", [
      JSON.stringify(bad),
      JSON.stringify(rules),
    ]),
    /GLF_BUDGET_TOTALS/,
  );
  bad.budget.lines[0].glf = 1.5;
  bad.activities = structuredClone(p.activities);
  await assert.rejects(
    rpc(
      "save_application",
      { application_id: id, expected_revision: 1, payload: bad },
      "other",
    ),
    /GLF_INVALID_BUDGET_LINE/,
  );
  bad.budget.lines[0].glf = 1000000;
  bad.budget.lines.push(bad.budget.lines[0]);
  await assert.rejects(
    rpc(
      "save_application",
      { application_id: id, expected_revision: 1, payload: bad },
      "other",
    ),
    /GLF_DUPLICATE_BUDGET_LINE/,
  );
});
test("working reviews isolate evaluators, preserve audit and reject stale versions, invalid scales and role misuse", async () => {
  const id = await rpc("create_application", { call_id: call }, "other");
  await db.query(
    "update public.applications set status='under_review',submitted_at=now(),payload=$2,revision=1 where id=$1",
    [id, JSON.stringify(payload)],
  );
  const version = (
    await db.query(
      "insert into public.application_versions(application_id,revision,stage,payload,rules_snapshot,actor_id) values($1,1,1,$2,$3,$4) returning id",
      [id, JSON.stringify(payload), JSON.stringify(rules), ids.other],
    )
  ).rows[0].id;
  const args = {
    app_id: id,
    submitted_version: version,
    review_kind: "rubric",
    expected_revision: 0,
    values_json: { 1.1: 4, 1.2: null },
    observation: "Primera revisión",
  };
  for (const user of [
    "applicant",
    "other",
    "reviewer",
    "coordinator",
    "grants",
  ])
    await assert.rejects(
      rpc("save_working_review", args, user),
      /GLF_FORBIDDEN/,
    );
  for (const n of [0, 6, 1.5, "5"])
    await assert.rejects(
      rpc(
        "save_working_review",
        { ...args, values_json: { 1.1: n } },
        "committee",
      ),
      /GLF_INVALID_REVIEW_SCORE/,
    );
  await assert.rejects(
    rpc(
      "save_working_review",
      { ...args, expected_revision: null },
      "committee",
    ),
    /GLF_VERSION_CONFLICT/,
  );
  await assert.rejects(
    as("committee", async () => {
      await db.query("select set_config('request.jwt.claim.aal','aal1',true)");
      return db.query(
        "select public.save_working_review($1,$2,'rubric',0,'{}','')",
        [id, version],
      );
    }),
    /GLF_FORBIDDEN/,
  );
  const first = await rpc("save_working_review", args, "committee");
  assert.equal(first.revision, 1);
  await assert.rejects(
    rpc("save_working_review", args, "committee"),
    /GLF_VERSION_CONFLICT/,
  );
  const second = await rpc("save_working_review", args, "admin");
  assert.notEqual(first.id, second.id);
  assert.equal(
    (
      await as("committee", () =>
        db.query(
          "select id from public.review_working_drafts where application_id=$1",
          [id],
        ),
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await as("other", () =>
        db.query("select id from public.review_working_drafts"),
      )
    ).rows.length,
    0,
  );
  await rpc(
    "save_working_review",
    { ...args, expected_revision: 1, values_json: { 1.1: 5 } },
    "committee",
  );
  assert.equal(
    (
      await as("committee", () =>
        db.query(
          "select id from public.review_draft_history where application_id=$1",
          [id],
        ),
      )
    ).rows.length,
    2,
  );
  await rpc(
    "save_working_review",
    {
      ...args,
      review_kind: "administrative",
      values_json: { cofinance: "not_applicable" },
    },
    "grants",
  );
  await assert.rejects(
    rpc(
      "save_working_review",
      {
        ...args,
        review_kind: "administrative",
        values_json: { cofinance: "wrong" },
      },
      "grants",
    ),
    /GLF_INVALID_CHECKLIST/,
  );
  await assert.rejects(
    as("committee", () =>
      db.query(
        "update public.review_working_drafts set notes='tamper' where id=$1",
        [first.id],
      ),
    ),
    /permission denied/,
  );
  assert.equal(
    (await db.query("select status from public.applications where id=$1", [id]))
      .rows[0].status,
    "under_review",
  );
  await db.query(
    "insert into public.application_versions(application_id,revision,stage,payload,rules_snapshot,actor_id) values($1,2,1,$2,$3,$4)",
    [id, JSON.stringify(payload), JSON.stringify(rules), ids.other],
  );
  await assert.rejects(
    rpc("save_working_review", { ...args, expected_revision: 2 }, "committee"),
    /GLF_VERSION_CONFLICT/,
  );
});

test("new grant snapshots correct exact boundaries without changing historical rules or maximum durations", async () => {
  const mixed = {
    ...rules,
    categories: [
      {
        ...rules.categories[0],
        id: "medium",
        min_amount: 100000,
        max_amount: 250000,
        max_months: 24,
        cofinance_percent: 10,
      },
      {
        ...rules.categories[0],
        id: "large",
        min_amount: 250000,
        max_amount: null,
        max_months: 36,
        cofinance_percent: 25,
      },
    ],
  };
  const c = await rpc(
    "create_call",
    {
      details: {
        code: "RANGES-2025",
        title_es: "Rangos",
        title_en: "Ranges",
        description_es: "Rangos",
        description_en: "Ranges",
        opens_at: "2020-01-01T00:00:00Z",
        closes_at: "2099-01-01T00:00:00Z",
        rules: mixed,
        phase2_schema: [],
      },
    },
    "grants",
  );
  await rpc("publish_call", { call_id: c }, "grants");
  const a = await rpc("create_application", { call_id: c });
  const snapshot = (
    await db.query(
      "select rules_snapshot from public.applications where id=$1",
      [a],
    )
  ).rows[0].rules_snapshot;
  assert.equal(snapshot.categories[0].min_amount, 100000.01);
  assert.equal(snapshot.categories[1].min_amount, 250000.01);
  assert.equal(
    (await db.query("select rules from public.calls where id=$1", [c])).rows[0]
      .rules.categories[1].min_amount,
    250000,
  );
  const p = structuredClone(payload);
  Object.assign(p.concept, {
    category_id: "large",
    requested_amount: 250000,
    cofinance_amount: 62500,
  });
  await db.query("select private.validate_payload($1,$2,true,1)", [
    JSON.stringify(p),
    JSON.stringify(mixed),
  ]);
  await assert.rejects(
    db.query("select private.validate_payload($1,$2,true,1)", [
      JSON.stringify(p),
      JSON.stringify(snapshot),
    ]),
    /GLF_CATEGORY_AMOUNT/,
  );
  p.concept.requested_amount = 250000.01;
  p.concept.cofinance_amount = 62500.01;
  await db.query("select private.validate_payload($1,$2,true,1)", [
    JSON.stringify(p),
    JSON.stringify(snapshot),
  ]);
  p.concept.end_date = "2030-01-01";
  await assert.rejects(
    db.query("select private.validate_payload($1,$2,true,1)", [
      JSON.stringify(p),
      JSON.stringify(snapshot),
    ]),
    /GLF_CATEGORY_DURATION/,
  );
});

test("custom bilingual themes survive call save, publication and frozen applicant rules", async () => {
  const custom = {
    id: "custom_12345678-1234-4123-8123-123456789012",
    label_es: "Restauración marina",
    label_en: "Marine restoration",
  };
  const unchecked = {
    id: "custom_12345678-1234-4123-8123-123456789013",
    label_es: "Ciencia comunitaria",
    label_en: "Community science",
  };
  const draft = await rpc(
    "save_call_draft",
    {
      details: {
        code: "CUSTOM-THEME-ROUNDTRIP",
        title_es: "Temas personalizados",
        title_en: "Custom themes",
        description_es: "Descripción",
        description_en: "Description",
        rules_version: "1",
        opens_at: "2020-01-01T00:00:00Z",
        closes_at: "2099-01-01T00:00:00Z",
        rules: {
          ...rules,
          theme_options: [custom, unchecked],
          themes: [custom],
        },
        phase2_schema: [],
      },
    },
    "grants",
  );
  assert.deepEqual(draft.rules.theme_options, [custom, unchecked]);
  const published = await rpc(
    "publish_call_reviewed",
    { call_id: draft.id, expected_revision: draft.revision },
    "grants",
  );
  assert.deepEqual(published.rules.themes, [custom]);
  const application = await rpc(
    "create_application",
    { call_id: draft.id },
    "other",
  );
  const stored = (
    await db.query(
      "select rules_snapshot from public.applications where id=$1",
      [application],
    )
  ).rows[0];
  assert.deepEqual(stored.rules_snapshot.themes, [custom]);
  assert.deepEqual(stored.rules_snapshot.theme_options, [custom, unchecked]);
});

test("structured attachment requirements survive publication and frozen rules without changing legacy required identifiers", async () => {
  const attachment = {
    id: "attachment_12345678-1234-4123-8123-123456789012",
    label_es: "Certificado institucional",
    label_en: "Institutional certificate",
    formats: ["pdf"],
    conditions: ["notarized"],
    instructions_es: "Copia legible",
    instructions_en: "Readable copy",
  };
  const draft = await rpc(
    "save_call_draft",
    {
      details: {
        code: "ATTACHMENT-ROUNDTRIP",
        title_es: "Anexos",
        title_en: "Attachments",
        description_es: "Descripción",
        description_en: "Description",
        rules_version: "1",
        opens_at: "2020-01-01T00:00:00Z",
        closes_at: "2099-01-01T00:00:00Z",
        rules: {
          ...rules,
          required_attachments: [attachment.id],
          attachment_requirements: [attachment],
        },
        phase2_schema: [],
      },
    },
    "grants",
  );
  const published = await rpc(
    "publish_call_reviewed",
    { call_id: draft.id, expected_revision: draft.revision },
    "grants",
  );
  assert.deepEqual(published.rules.required_attachments, [attachment.id]);
  const appId = await rpc("create_application", { call_id: draft.id }, "other");
  const app = (
    await db.query(
      "select rules_snapshot from public.applications where id=$1",
      [appId],
    )
  ).rows[0];
  assert.deepEqual(app.rules_snapshot.attachment_requirements, [attachment]);
  assert.deepEqual(app.rules_snapshot.required_attachments, [attachment.id]);
});

test("M01 database rejects individual medium/large outside the UI and preserves incompatible drafts on migration", async () => {
  const mixed = {
    ...rules,
    categories: [
      rules.categories[0],
      {
        ...rules.categories[0],
        id: "medium",
        min_amount: 100000.01,
        max_amount: 250000,
        max_months: 24,
        cofinance_percent: 10,
      },
      {
        ...rules.categories[0],
        id: "large",
        min_amount: 250000.01,
        max_amount: null,
        max_months: 36,
        cofinance_percent: 25,
      },
    ],
  };
  const validate = (p, r = mixed, stage = 1, complete = true) =>
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,$3,$4)", [
      JSON.stringify(p),
      JSON.stringify(r),
      complete,
      stage,
    ]);
  for (const [category, amount] of [
    ["small", 100000],
    ["medium", 150000],
    ["large", 350000],
  ]) {
    for (const type of ["individual", "organization"]) {
      const p = structuredClone(fullPayload);
      Object.assign(p.concept, {
        applicant_type: type,
        category_id: category,
        requested_amount: amount,
        cofinance_amount: amount * 0.25,
        identity_number: "0123456789",
        residence_number: "RP-1234",
      });
      for (const stage of [1, 2]) {
        const current =
          stage === 1 ? { ...p, activities: payload.activities } : p;
        if (type === "individual" && category !== "small") {
          await assert.rejects(
            validate(current, mixed, stage),
            /GLF_INDIVIDUAL_SMALL_ONLY/,
          );
          await validate(current, mixed, stage, false);
        } else await validate(current, mixed, stage);
      }
    }
  }
  const p = structuredClone(payload);
  Object.assign(p.concept, {
    applicant_type: "individual",
    identity_number: "0123456789",
    residence_number: "RP-1234",
    requested_amount: 100000.01,
  });
  await assert.rejects(
    validate(p, {
      ...mixed,
      categories: [{ ...mixed.categories[0], max_amount: 250000 }],
    }),
    /GLF_INDIVIDUAL_SMALL_ONLY/,
  );
  p.concept.requested_amount = 60000;
  await assert.rejects(
    validate(p, {
      ...mixed,
      categories: [{ ...mixed.categories[0], max_amount: 50000 }],
    }),
    /GLF_CATEGORY_AMOUNT/,
  );
  await assert.rejects(
    validate(p, { ...mixed, categories: [mixed.categories[1]] }),
    /GLF_CATEGORY_REQUIRED/,
  );
  await assert.rejects(
    validate(p, { ...mixed, applicant_types: ["organization"] }),
    /GLF_APPLICANT_TYPE/,
  );

  const owner = await temporaryAccount();
  const c = await rpc(
    "create_call",
    {
      details: {
        code: "M01-LOCAL",
        title_es: "M01 local",
        title_en: "M01 local",
        description_es: "M01 local",
        description_en: "M01 local",
        opens_at: "2020-01-01T00:00:00Z",
        closes_at: "2099-01-01T00:00:00Z",
        rules: mixed,
        phase2_schema: [],
      },
    },
    "grants",
  );
  await rpc("publish_call", { call_id: c }, "grants");
  const id = await rpc("create_application", { call_id: c }, owner);
  Object.assign(p.concept, {
    category_id: "medium",
    requested_amount: 150000,
    cofinance_amount: 15000,
  });
  p.activities = p.activities.map((a) => ({
    ...a,
    id: crypto.randomUUID(),
    risks: a.risks.map((r) => ({ ...r, id: crypto.randomUUID() })),
  }));
  assert.equal(
    await rpc(
      "save_application",
      { application_id: id, expected_revision: 0, payload: p },
      owner,
    ),
    1,
  );
  const reopened = (
    await as(owner, () =>
      db.query(
        "select payload,revision,rules_snapshot from public.applications where id=$1",
        [id],
      ),
    )
  ).rows[0];
  assert.deepEqual(reopened.payload, p);
  await assert.rejects(
    rpc(
      "prepare_application_documents",
      { app_id: id, expected_revision: 1 },
      owner,
    ),
    /GLF_INDIVIDUAL_SMALL_ONLY/,
  );

  // Simulate metadata prepared before M01, using only the isolated database.
  // No PDF is signed and no production service is contacted.
  await db.query(
    "insert into public.prepared_documents(application_id,revision,stage,payload) values($1,1,1,$2)",
    [id, p],
  );
  for (const kind of ["concept_signed", "matrix_signed"])
    await db.query(
      "insert into public.application_documents(application_id,kind,file_name,storage_path,content_type,size_bytes,sha256,uploaded_by) values($1,$2,$3,$4,'application/pdf',100,$5,$6)",
      [
        id,
        kind,
        kind + ".pdf",
        id + "/" + kind + ".pdf",
        "a".repeat(64),
        owner,
      ],
    );
  await assert.rejects(
    rpc(
      "submit_application",
      { application_id: id, expected_revision: 1 },
      owner,
    ),
    /GLF_INDIVIDUAL_SMALL_ONLY/,
  );
  const snapshot = async () => ({
    apps: (await db.query("select * from public.applications order by id"))
      .rows,
    versions: (
      await db.query("select * from public.application_versions order by id")
    ).rows,
    events: (
      await db.query("select * from public.application_events order by id")
    ).rows,
    prepared: (
      await db.query("select * from public.prepared_documents order by id")
    ).rows,
  });
  const beforeMigration = await snapshot();
  await db.exec(
    "drop function private.validate_payload(jsonb,jsonb,boolean,integer); drop function private.validate_payload_before_organization_domicile(jsonb,jsonb,boolean,integer); alter function private.validate_payload_before_individual_small(jsonb,jsonb,boolean,integer) rename to validate_payload;",
  );
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610170037_individual_small_grant_only.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610170038_organization_galapagos_domicile.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.deepEqual(await snapshot(), beforeMigration);
  await assert.rejects(
    rpc(
      "prepare_application_documents",
      { app_id: id, expected_revision: 1 },
      owner,
    ),
    /GLF_INDIVIDUAL_SMALL_ONLY/,
  );
  for (const role of ["anon", "authenticated"])
    assert.equal(
      (
        await db.query(
          "select has_function_privilege($1,'private.validate_payload_before_individual_small(jsonb,jsonb,boolean,integer)','EXECUTE') as allowed",
          [role],
        )
      ).rows[0].allowed,
      false,
    );
  // Switching type back restores the call's organization options, without rewriting amounts.
  p.concept.applicant_type = "organization";
  assert.equal(
    await rpc(
      "save_application",
      { application_id: id, expected_revision: 1, payload: p },
      owner,
    ),
    2,
  );
  await rpc(
    "prepare_application_documents",
    { app_id: id, expected_revision: 2 },
    owner,
  );
});

test("M03 enforces organization province outside the UI and migration preserves incompatible historical drafts", async () => {
  const validate = (p, stage, complete) =>
    db.query("select private.validate_payload($1::jsonb,$2::jsonb,$3,$4)", [
      p,
      rules,
      complete,
      stage,
    ]);
  for (const stage of [1, 2]) {
    for (const complete of [false, true]) {
      const p = structuredClone(stage === 1 ? payload : fullPayload);
      for (const province of ["Guayas", "Pichincha", "", undefined]) {
        p.concept.province = province;
        await assert.rejects(
          validate(p, stage, complete),
          /GLF_ORGANIZATION_PROVINCE/,
        );
      }
      p.concept.province = "Galápagos";
      await validate(p, stage, complete);
      p.concept.applicant_type = "individual";
      p.concept.identity_number = "0123456789";
      p.concept.residence_number = "RP-1234";
      for (const province of ["Guayas", "Pichincha", "Azuay"]) {
        p.concept.province = province;
        await validate(p, stage, complete);
      }
    }
  }
  const owner = await temporaryAccount();
  const id = await rpc("create_application", { call_id: call }, owner);
  const p = structuredClone(payload);
  p.activities = p.activities.map((a) => ({
    ...a,
    id: crypto.randomUUID(),
    risks: a.risks.map((r) => ({ ...r, id: crypto.randomUUID() })),
  }));
  p.concept.province = "Guayas";
  p.concept.city = "Guayaquil";
  await assert.rejects(
    rpc(
      "save_application",
      { application_id: id, expected_revision: 0, payload: p },
      owner,
    ),
    /GLF_ORGANIZATION_PROVINCE/,
  );
  // Emulate a pre-M03 draft only in the isolated test database.
  await db.exec(
    "drop function private.validate_payload(jsonb,jsonb,boolean,integer); alter function private.validate_payload_before_organization_domicile(jsonb,jsonb,boolean,integer) rename to validate_payload;",
  );
  await rpc(
    "save_application",
    { application_id: id, expected_revision: 0, payload: p },
    owner,
  );
  const snapshot = async () => ({
    apps: (await db.query("select * from public.applications order by id"))
      .rows,
    versions: (
      await db.query("select * from public.application_versions order by id")
    ).rows,
    events: (
      await db.query("select * from public.application_events order by id")
    ).rows,
  });
  const before = await snapshot();
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610170038_organization_galapagos_domicile.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.deepEqual(await snapshot(), before);
  const read = () =>
    as(owner, () =>
      db.query("select payload from public.applications where id=$1", [id]),
    );
  assert.deepEqual((await read()).rows[0].payload, p);
  await assert.rejects(
    rpc(
      "save_application",
      { application_id: id, expected_revision: 1, payload: p },
      owner,
    ),
    /GLF_ORGANIZATION_PROVINCE/,
  );
  Object.assign(p.concept, { province: "Galápagos", city: "Puerto Ayora" });
  await rpc(
    "save_application",
    { application_id: id, expected_revision: 1, payload: p },
    owner,
  );
  assert.deepEqual((await read()).rows[0].payload, p);
  for (const role of ["anon", "authenticated"])
    assert.equal(
      (
        await db.query(
          "select has_function_privilege($1,'private.validate_payload_before_organization_domicile(jsonb,jsonb,boolean,integer)','EXECUTE') as allowed",
          [role],
        )
      ).rows[0].allowed,
      false,
    );
});

test("v2 dossiers preserve unified and legacy summaries across signing, review, phase two and immutable versions", async () => {
  for (const type of ["individual", "organization"]) {
    const owner = "other";
    const id = await rpc("create_application", { call_id: call }, owner);
    const p = structuredClone(payload);
    p.concept.applicant_type = type;
    p.concept.residence_number = type === "individual" ? "RP-AUDIT-001" : "";
    p.concept.identity_number = type === "individual" ? "0123456789" : "";
    p.concept.ruc = type === "organization" ? "2090000000001" : "";
    p.concept.summary_parts = {
      context: type === "individual" ? "Contexto previamente guardado." : "",
      problem: "",
      threats: "",
      rationale: "",
      solution: type === "individual" ? "Solución previamente guardada." : "",
      results: "",
    };
    p.concept.summary =
      type === "individual"
        ? "Contexto previamente guardado.\n\nSolución previamente guardada."
        : "Resumen integrado en una sola caja con contexto, problema, solución y resultados.";
    const general = crypto.randomUUID(),
      specific = crypto.randomUUID();
    p.concept.strategic_alignment = {
      version: "pg2030-ods-general-v2",
      objectives: [
        {
          id: general,
          kind: "general",
          text: "Conservar el ecosistema marino",
          plan: ["E1"],
          ods: [14],
          glf: [],
          contribution: "Restaurar hábitats costeros",
        },
        {
          id: specific,
          kind: "specific",
          text: "Restaurar una hectárea",
          plan: [],
          ods: [],
          glf: [],
          contribution: "",
        },
      ],
    };
    p.activities = p.activities.map((a) => ({
      ...a,
      id: crypto.randomUUID(),
      objective_ids: [specific],
      risks: a.risks.map((r) => ({ ...r, id: crypto.randomUUID() })),
    }));
    assert.equal(
      await rpc(
        "save_application",
        { application_id: id, expected_revision: 0, payload: p },
        owner,
      ),
      1,
    );
    await rpc(
      "prepare_application_documents",
      { app_id: id, expected_revision: 1 },
      owner,
    );
    for (const [i, kind] of ["concept_signed", "matrix_signed"].entries()) {
      const path = `${id}/${ids[owner]}/attachment/${kind}.pdf`;
      await as(owner, () =>
        db.query(
          "insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,$2)",
          [path, { size: 100 }],
        ),
      );
      await rpc(
        "register_signed_document",
        {
          app_id: id,
          expected_revision: 1,
          object_path: path,
          original_name: `${kind}.pdf`,
          mime: "application/pdf",
          bytes: 100,
          checksum: String(i + 1).repeat(64),
          document_kind: kind,
        },
        owner,
      );
    }
    assert.equal(
      await rpc(
        "submit_application",
        { application_id: id, expected_revision: 1 },
        owner,
      ),
      2,
    );
    const version = (
      await as("grants", () =>
        db.query(
          "select id,payload from public.application_versions where application_id=$1 order by revision desc",
          [id],
        ),
      )
    ).rows[0];
    assert.equal(
      version.payload.concept.strategic_alignment.version,
      "pg2030-ods-general-v2",
    );
    assert.deepEqual(
      version.payload.concept.strategic_alignment.objectives,
      p.concept.strategic_alignment.objectives,
    );
    assert.equal(
      version.payload.concept[
        type === "individual" ? "residence_number" : "ruc"
      ],
      p.concept[type === "individual" ? "residence_number" : "ruc"],
    );
    assert.equal(version.payload.attachments.length, 2);
    assert.equal(version.payload.concept.summary, p.concept.summary);
    assert.equal(
      version.payload.concept.identity_number,
      p.concept.identity_number,
    );
    assert.equal(
      (
        await as("applicant", () =>
          db.query(
            "select id from public.application_versions where application_id=$1",
            [id],
          ),
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      rpc(
        "save_application",
        { application_id: id, expected_revision: 2, payload: p },
        owner,
      ),
      /GLF_APPLICATION_LOCKED/,
    );
    await rpc(
      "record_review",
      {
        application_id: id,
        expected_revision: 2,
        review_type: "safeguards",
        findings: "Evaluación humana documentada",
        recommendation: "Continuar",
        category: "B",
      },
      "reviewer",
    );
    await rpc(
      "record_decision",
      {
        application_id: id,
        expected_revision: 2,
        body: "committee",
        decision: "invite",
        reference: `V2-${type}`,
        rationale: "Preselección documentada",
        invitation_deadline: "2099-01-01",
      },
      "committee",
    );
    const inherited = (
      await as(owner, () =>
        db.query(
          "select reference_code,stage,status,payload,phase2_deadline from public.applications where id=$1",
          [id],
        ),
      )
    ).rows[0];
    assert.equal(inherited.stage, 2);
    assert.equal(inherited.status, "selected_for_phase2");
    assert.ok(inherited.phase2_deadline);
    assert.equal(inherited.payload.concept.summary, p.concept.summary);
    assert.deepEqual(
      inherited.payload.concept.summary_parts,
      p.concept.summary_parts,
    );
    assert.deepEqual(inherited.payload.activities, version.payload.activities);
    assert.equal(inherited.payload.consent, false);
    assert.equal(inherited.payload.truthful, false);
    await assert.rejects(
      rpc(
        "submit_application",
        { application_id: id, expected_revision: 3 },
        owner,
      ),
      /GLF_DECLARATIONS_REQUIRED|GLF_REQUIRED/,
    );
    const phase2 = structuredClone(fullPayload);
    phase2.concept = {
      ...p.concept,
      title: "Proyecto completo en preparación",
      summary: "Resumen actualizado únicamente en la propuesta completa.",
      summary_parts: {
        context: "",
        problem: "",
        threats: "",
        rationale: "",
        solution: "",
        results: "",
      },
    };
    phase2.phase2.proposal = "Detalle de la propuesta completa";
    phase2.activities = phase2.activities.map((a, i) => ({
      ...a,
      id: p.activities[i].id,
      objective_ids: [specific],
      risks: a.risks.map((r, j) => ({ ...r, id: p.activities[i].risks[j].id })),
    }));
    assert.equal(
      await rpc(
        "save_application",
        { application_id: id, expected_revision: 3, payload: phase2 },
        owner,
      ),
      4,
    );
    const frozen = (
      await as("grants", () =>
        db.query(
          "select payload from public.application_versions where id=$1",
          [version.id],
        ),
      )
    ).rows[0].payload;
    assert.equal(frozen.concept.title, p.concept.title);
    assert.equal(frozen.concept.summary, p.concept.summary);
    assert.deepEqual(frozen.concept.summary_parts, p.concept.summary_parts);
    assert.deepEqual(frozen.activities[0].objective_ids, [specific]);
    const prepared2 = await rpc(
      "prepare_application_documents",
      { app_id: id, expected_revision: 4 },
      owner,
    );
    const preparedState = (
      await as(owner, () =>
        db.query(
          "select stage,payload from public.prepared_documents where id=$1",
          [prepared2],
        ),
      )
    ).rows[0];
    assert.equal(preparedState.stage, 2);
    assert.equal(preparedState.payload.concept.summary, phase2.concept.summary);
    assert.equal(
      await rpc(
        "submit_application",
        { application_id: id, expected_revision: 4 },
        owner,
      ),
      5,
    );
    const latest = (
      await as("grants", () =>
        db.query(
          "select stage,payload from public.application_versions where application_id=$1 order by revision desc",
          [id],
        ),
      )
    ).rows[0];
    assert.equal(latest.stage, 2);
    assert.equal(latest.payload.concept.summary, phase2.concept.summary);
    const finalState = (
      await as(owner, () =>
        db.query(
          "select reference_code,status from public.applications where id=$1",
          [id],
        ),
      )
    ).rows[0];
    assert.equal(finalState.reference_code, inherited.reference_code);
    assert.equal(finalState.status, "phase2_submitted");
    assert.equal(
      latest.payload.concept.strategic_alignment.objectives[1].id,
      specific,
    );
    assert.equal(
      latest.payload.activities[0].risks[0].residual_probability,
      fullPayload.activities[0].risks[0].residual_probability,
    );
  }
});


test("M05 database: isolated drafts, individual letters, history and direct RPC submission", async()=>{
 // M01/M03 deliberately replay earlier validators. Restore the latest installed wrapper before testing M05.
 await db.exec(currentPayloadValidator);
 const owner=await temporaryAccount();
 const c=await rpc("create_call",{details:{code:"M05-LOCAL",title_es:"M05",title_en:"M05",description_es:"QA",description_en:"QA",opens_at:"2020-01-01T00:00:00Z",closes_at:"2099-01-01T00:00:00Z",rules:{...rules,required_attachments:["partner_letters"]}}},"grants");
 await rpc("publish_call",{call_id:c},"grants");
 const a={id:crypto.randomUUID(),name:"Socio A"}, b={id:crypto.randomUUID(),name:"Socio B"};
 const patch=(rows)=>({partner_organizations:rows,associated_organizations:rows.map(r=>r.name),partners:rows.map((r,i)=>`${i+1}. ${r.name}`).join("\n")});
 const kind=p=>"partner_letter_"+p.id.replaceAll("-","");
 const make=async(rows)=>{
  const id=await rpc("create_application",{call_id:c},owner);
  const p=structuredClone(payload);Object.assign(p.concept,patch(rows));
  p.activities=p.activities.map(a=>({...a,id:crypto.randomUUID(),risks:a.risks.map(r=>({...r,id:crypto.randomUUID()}))}));
  await rpc("save_application",{application_id:id,expected_revision:0,payload:p},owner);
  return {id,p};
 };
 const upload=async(id,k,n="letter.pdf")=>{
  const path=`${id}/${owner}/attachment/${crypto.randomUUID()}.pdf`;
  await as(owner,()=>db.query("insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,$2)",[path,{size:100}]));
  return rpc("register_document",{app_id:id,object_path:path,original_name:n,mime:"application/pdf",bytes:100,checksum:"a".repeat(64),document_kind:k},owner);
 };
 const signed=async(id,revision)=>{
  await rpc("prepare_application_documents",{app_id:id,expected_revision:revision},owner);
  await upload(id,"concept_signed","concept.pdf");await upload(id,"matrix_signed","matrix.pdf");
 };
 const check=async(id)=>db.query("select private.validate_partner_letters(a) from public.applications a where id=$1",[id]);
 const multi=await make([a,b]); // Missing letters do not prevent draft saving or PDF preparation.
 await signed(multi.id,1);
 await assert.rejects(rpc("submit_application",{application_id:multi.id,expected_revision:1},owner),new RegExp("GLF_PARTNER_LETTER_REQUIRED:"+a.id.replaceAll("-","")));
 await upload(multi.id,"partner_letters","old-unlinked.pdf");
 await assert.rejects(check(multi.id),/GLF_PARTNER_LETTER_REQUIRED/);
 const first=await upload(multi.id,kind(a));
 await assert.rejects(check(multi.id),new RegExp("GLF_PARTNER_LETTER_REQUIRED:"+b.id.replaceAll("-","")));
 await assert.rejects(upload(multi.id,kind({id:crypto.randomUUID()})),/GLF_PARTNER_LINK_REQUIRED/);
 await upload(multi.id,kind(b));
 await check(multi.id);
 Object.assign(multi.p.concept,patch([b,{...a,name:"Socio A renombrado"}]));
 await rpc("save_application",{application_id:multi.id,expected_revision:1,payload:multi.p},owner);
 await check(multi.id);
 const reopened=(await as(owner,()=>db.query("select payload from public.applications where id=$1",[multi.id]))).rows[0].payload;
 assert.equal(reopened.concept.partner_organizations[1].id,a.id);
 assert.equal(reopened.concept.partner_organizations[1].name,"Socio A renombrado");
 Object.assign(multi.p.concept,patch([b]));
 await rpc("save_application",{application_id:multi.id,expected_revision:2,payload:multi.p},owner);
 await check(multi.id);
 assert.equal((await db.query("select count(*)::int n from public.application_documents where id=$1",[first])).rows[0].n,1);
 await signed(multi.id,3);
 assert.equal(await rpc("submit_application",{application_id:multi.id,expected_revision:3},owner),4);
 const snap=(await db.query("select payload from public.application_versions where application_id=$1",[multi.id])).rows[0].payload;
 assert.equal(snap.concept.partner_organizations[0].id,b.id);
 assert.ok(snap.attachments.some(d=>d.id===first));
 const zero=await make([]);await signed(zero.id,1);
 assert.equal(await rpc("submit_application",{application_id:zero.id,expected_revision:1},owner),2);
 const single=await make([a]);await upload(single.id,kind(a));await signed(single.id,1);
 assert.equal(await rpc("submit_application",{application_id:single.id,expected_revision:1},owner),2);
 const legacy=await make([]);delete legacy.p.concept.partner_organizations;legacy.p.concept.associated_organizations=["Socio antiguo"];legacy.p.concept.partners="Socio antiguo";
 await rpc("save_application",{application_id:legacy.id,expected_revision:1,payload:legacy.p},owner);
 await upload(legacy.id,"partner_letters");await signed(legacy.id,2);
 await assert.rejects(rpc("submit_application",{application_id:legacy.id,expected_revision:2},owner),/GLF_PARTNER_LINK_REQUIRED/);
 const blank=await make([{...a,name:""}]);
 await assert.rejects(rpc("prepare_application_documents",{app_id:blank.id,expected_revision:1},owner),/GLF_REQUIRED:partners/);
 const invalid=structuredClone(payload);Object.assign(invalid.concept,patch([a,a]));
 await assert.rejects(db.query("select private.validate_payload($1::jsonb,$2::jsonb,false,1)",[JSON.stringify(invalid),JSON.stringify(rules)]),/GLF_INVALID_PARTNERS/);
 for(const role of ["anon","authenticated"]){
  for(const signature of ["private.validate_partner_letters(public.applications)","private.check_partner_letter_upload()","public.submit_application_core(uuid,integer)"]){
   assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') allowed",[role,signature])).rows[0].allowed,false);
  }
 }
});

test("M07 SQL: distinct call catalogues, invalid/legacy topics, draft roundtrip and missing-catalogue completion block", async () => {
  await db.exec(currentPayloadValidator);
  const owner = await temporaryAccount();
  const research = {id:"research",label_es:"Investigación",label_en:"Research"};
  const education = {id:"education",label_es:"Iniciativas de Educación y vinculación comunitaria",label_en:"Education and community outreach"};
  const fixtures = [];
  for (const [name, themes] of [["A",[research]], ["B",[education]], ["NONE",[]]]) {
    const r = {...rules, themes, theme_options:[research, education]};
    const c = await rpc("create_call", {details:{code:"M07-"+name,title_es:"M07 "+name,title_en:"M07 "+name,description_es:"QA",description_en:"QA",opens_at:"2020-01-01T00:00:00Z",closes_at:"2099-01-01T00:00:00Z",rules:r}}, "grants");
    await rpc("publish_call", {call_id:c}, "grants");
    const id = await rpc("create_application", {call_id:c}, owner);
    const p = structuredClone(payload);
    p.concept.project_type = name === "NONE" ? "Tema histórico sin catálogo" : themes[0].id;
    p.activities = p.activities.map(a=>({...a,id:crypto.randomUUID(),risks:a.risks.map(r=>({...r,id:crypto.randomUUID()}))}));
    const read = async()=> (await as(owner,()=>db.query("select payload,rules_snapshot,revision,status from public.applications where id=$1",[id]))).rows[0];
    await rpc("save_application", {application_id:id,expected_revision:0,payload:p}, owner);
    const reopened = await read();
    assert.deepEqual(reopened.payload,p);
    assert.deepEqual(reopened.rules_snapshot.themes,themes);
    fixtures.push({c,id,p,r,read});
  }
  const validate = (p,r,complete=true,stage=1)=>db.query("select private.validate_payload($1::jsonb,$2::jsonb,$3,$4)",[JSON.stringify(p),JSON.stringify(r),complete,stage]);
  for (const [i, own, foreign] of [[0,"research","education"],[1,"education","research"]]) {
    const f = fixtures[i];
    await validate(f.p,f.r);
    await rpc("prepare_application_documents",{app_id:f.id,expected_revision:1},owner);
    for (const value of [foreign,"Texto libre",""]) {
      const p = structuredClone(f.p);p.concept.project_type=value;
      await validate(p,f.r,false);
      await assert.rejects(validate(p,f.r),/GLF_INVALID_PROJECT_THEME|GLF_REQUIRED:project_type/);
    }
    assert.equal((await f.read()).payload.concept.project_type,own);
  }
  const f = fixtures[2], original = await f.read();
  const withoutThemes = {...f.r};
  delete withoutThemes.themes;
  for (const r of [f.r, {...f.r,themes:null}, withoutThemes]) {
    await validate(f.p,r,false);
    for (const stage of [1,2])
      await assert.rejects(validate(f.p,r,true,stage),/GLF_CALL_THEMES_REQUIRED/);
  }
  await assert.rejects(rpc("prepare_application_documents",{app_id:f.id,expected_revision:1},owner),/GLF_CALL_THEMES_REQUIRED/);
  assert.deepEqual(await f.read(),original);
  // A foreign historical value can be saved/reopened but never completed.
  const legacy = fixtures[0];legacy.p.concept.project_type="Texto histórico original";
  await rpc("save_application",{application_id:legacy.id,expected_revision:1,payload:legacy.p},owner);
  assert.equal((await legacy.read()).payload.concept.project_type,"Texto histórico original");
  await assert.rejects(rpc("prepare_application_documents",{app_id:legacy.id,expected_revision:2},owner),/GLF_INVALID_PROJECT_THEME/);
  // Editing the live call does not rewrite this application's frozen catalogue.
  await db.query("update public.calls set rules=$1 where id=$2",[JSON.stringify(fixtures[1].r),legacy.c]);
  assert.deepEqual((await legacy.read()).rules_snapshot.themes,[research]);
  legacy.p.concept.project_type="research";
  await rpc("save_application",{application_id:legacy.id,expected_revision:2,payload:legacy.p},owner);
  await rpc("prepare_application_documents",{app_id:legacy.id,expected_revision:3},owner);
  assert.equal((await legacy.read()).payload.concept.project_type,"research");
  for (const role of ["anon","authenticated"])
    for (const signature of ["private.validate_payload(jsonb,jsonb,boolean,integer)","private.validate_payload_before_call_topics(jsonb,jsonb,boolean,integer)"])
      assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') allowed",[role,signature])).rows[0].allowed,false);
});

test("M07 migration preserves all existing drafts, submitted versions, prepared documents and events", async () => {
  await db.exec("drop function private.validate_payload(jsonb,jsonb,boolean,integer); alter function private.validate_payload_before_call_topics(jsonb,jsonb,boolean,integer) rename to validate_payload;");
  // Isolated pre-M07 dossier with prepared documents: even an old prepared
  // revision and two registered PDFs must not bypass the new catalogue rule.
  const owner = await temporaryAccount();
  const c = await rpc("create_call",{details:{code:"M07-LEGACY",title_es:"M07 legado",title_en:"M07 legacy",description_es:"QA",description_en:"QA",opens_at:"2020-01-01T00:00:00Z",closes_at:"2099-01-01T00:00:00Z",rules:{...rules,themes:[]}}},"grants");
  await rpc("publish_call",{call_id:c},"grants");
  const id = await rpc("create_application",{call_id:c},owner);
  const p = structuredClone(payload);
  p.concept.project_type = "Tema histórico sin catálogo";
  p.activities=p.activities.map(a=>({...a,id:crypto.randomUUID(),risks:a.risks.map(r=>({...r,id:crypto.randomUUID()}))}));
  await rpc("save_application",{application_id:id,expected_revision:0,payload:p},owner);
  await rpc("prepare_application_documents",{app_id:id,expected_revision:1},owner);
  for (const kind of ["concept_signed","matrix_signed"]) {
    const path=`${id}/${owner}/attachment/${crypto.randomUUID()}.pdf`;
    await as(owner,()=>db.query("insert into storage.objects(bucket_id,name,metadata) values('application-files',$1,$2)",[path,{size:100}]));
    await rpc("register_document",{app_id:id,object_path:path,original_name:kind+".pdf",mime:"application/pdf",bytes:100,checksum:"a".repeat(64),document_kind:kind},owner);
  }
  const snapshot = async()=>({
    applications:(await db.query("select * from public.applications order by id")).rows,
    versions:(await db.query("select * from public.application_versions order by id")).rows,
    prepared:(await db.query("select * from public.prepared_documents order by id")).rows,
    events:(await db.query("select * from public.application_events order by id")).rows,
    calls:(await db.query("select * from public.calls order by id")).rows,
  });
  const before = await snapshot();
  await db.exec(await readFile(new URL("../../supabase/migrations/202610170040_call_topics_required.sql",import.meta.url),"utf8"));
  assert.deepEqual(await snapshot(),before);
  await assert.rejects(rpc("submit_application",{application_id:id,expected_revision:1},owner),/GLF_CALL_THEMES_REQUIRED/);
  assert.deepEqual(await snapshot(),before);
});
