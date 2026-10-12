import { test } from "node:test";
import assert from "node:assert/strict";
import { backupSelectionSchema } from "../src/lib/backup-selection";
import { defaultCall, resolveFilters } from "../src/lib/inbox-filters";
import { summaryWorkbook } from "../src/lib/backup-workbook";
import { unzipSync, strFromU8 } from "fflate";
import type { Call } from "../src/lib/domain";
const id = "7f3af678-2728-41d5-8ff6-bfb5fa1395cf";
test("filters default to newest open published call and preserve explicit all", () => {
  const call = (
    id: string,
    status: string,
    opens_at: string,
    closes_at: string,
  ) =>
    ({
      id,
      status,
      opens_at,
      closes_at,
      rules: { categories: [] },
    }) as unknown as Call;
  const calls = [
    call("old", "published", "2026-01-01", "2026-12-31"),
    call("new", "published", "2026-09-01", "2026-12-31"),
    call("draft", "draft", "2026-10-01", "2026-12-31"),
  ];
  assert.equal(defaultCall(calls, Date.parse("2026-10-11")), "new");
  assert.equal(resolveFilters(calls, { call: "all" }, "es").call, "all");
  assert.equal(defaultCall([], 0), "all");
  assert.equal(defaultCall(calls, Date.parse("2027-01-01")), "new");
});
test("backup Excel escapes applicant text and uses latest submitted version", () => {
  const bytes = summaryWorkbook(
    {
      applications: [{ id, reference_code: "REF", call_id: "c" }],
      application_versions: [
        {
          application_id: id,
          revision: 1,
          payload: { concept: { title: "old" } },
        },
        {
          application_id: id,
          revision: 2,
          payload: {
            concept: {
              title: "=1+1 & <test>",
              email: "a@b.ec",
              phone: "+593999999999",
            },
          },
        },
      ],
    },
    "es",
  );
  const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]);
  assert.ok(sheet.includes("=1+1 &amp; &lt;test&gt;"));
  assert.ok(sheet.includes("a@b.ec"));
  assert.ok(!sheet.includes("<f>"));
  assert.ok(!sheet.includes(">old<"));
});
test("backup scope never broadens an empty or conflicting selection", () => {
  for (const selection of [
    {},
    { scope: "selected", applications: [] },
    { scope: "call", call: "" },
    { scope: "all", applications: [id] },
    { scope: "selected", applications: [id, id] },
    { scope: "selected", applications: ["invalid"] },
    { scope: "call", call: id, applications: [id] },
  ])
    assert.equal(backupSelectionSchema.safeParse(selection).success, false);
  assert.equal(backupSelectionSchema.safeParse({ scope: "all" }).success, true);
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "call", call: id }).success,
    true,
  );
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "selected", applications: [id] })
      .success,
    true,
  );
});

test("Excel exports exactly three distinct applications plus header without collapsing records", () => {
 const applications = [1,2,3].map(n=>({id:String(n),reference_code:`REF-${n}`,call_id:"c"}));
 const application_versions = applications.map(a=>({application_id:a.id,revision:1,payload:{concept:{title:`Project ${a.id}`}}}));
 const sheet = strFromU8(unzipSync(summaryWorkbook({applications,application_versions},"es"))["xl/worksheets/sheet1.xml"]);
 assert.equal((sheet.match(/<row r=/g)||[]).length,4);
 for(const a of applications) assert.ok(sheet.includes(a.reference_code));
});
