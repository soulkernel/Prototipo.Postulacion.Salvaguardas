import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { removePartnerAndFiles } from "../src/lib/partner-removal";
import { emptyPayload } from "../src/lib/domain";

function fixture() {
  const calls: string[] = [],
    removed: string[][] = [];
  const payload = emptyPayload();
  const state = {
    beginError: "",
    storageError: false,
    finishError: false,
    throwStorage: false,
    done: false,
    paths: ["a.pdf", "b.pdf"],
  };
  const db = {
    rpc: async (name: string) => {
      calls.push(name);
      if (name === "begin_remove_partner")
        return {
          data: { done: state.done, paths: state.paths, revision: 8, payload },
          error: state.beginError ? { message: state.beginError } : null,
        };
      return {
        data: { revision: 8, payload },
        error: state.finishError
          ? { message: "GLF_DELETE_FILES_PENDING" }
          : null,
      };
    },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          assert.equal(bucket, "application-files");
          removed.push(paths);
          if (state.throwStorage) throw Error("network failure");
          return {
            error: state.storageError
              ? { message: "Storage unavailable" }
              : null,
          };
        },
      }),
    },
  } as unknown as SupabaseClient;
  return {
    state,
    calls,
    removed,
    payload,
    run: () => removePartnerAndFiles(db, "app", 7, "partner"),
  };
}
test("confirmed partner removal calls Storage before finalization, and handles no-letter organizations", async () => {
  for (const paths of [[], ["a.pdf", "b.pdf"]]) {
    const f = fixture();
    f.state.paths = paths;
    assert.deepEqual(await f.run(), {
      ok: true,
      revision: 8,
      payload: f.payload,
    });
    assert.deepEqual(f.calls, [
      "begin_remove_partner",
      "finish_remove_partner",
    ]);
    assert.deepEqual(f.removed, paths.length ? [paths] : []);
  }
});
test("forbidden and stale removal does not touch Storage", async () => {
  const f = fixture();
  f.state.beginError = "GLF_VERSION_CONFLICT";
  assert.deepEqual(await f.run(), {
    ok: false,
    error: "GLF_VERSION_CONFLICT",
    pending: false,
  });
  assert.deepEqual(f.removed, []);
  assert.equal(f.calls.length, 1);
});
test("Storage error/exception never finalizes or claims success; retry completes", async () => {
  for (const thrown of [false, true]) {
    const f = fixture();
    f.state.storageError = !thrown;
    f.state.throwStorage = thrown;
    assert.deepEqual(await f.run(), {
      ok: false,
      error: "GLF_DELETE_FILES_PENDING",
      pending: true,
    });
    assert.deepEqual(f.calls, ["begin_remove_partner"]);
    f.state.storageError = false;
    f.state.throwStorage = false;
    assert.equal((await f.run()).ok, true);
  }
});
test("finalization failure stays pending and a lost success response is idempotent", async () => {
  const f = fixture();
  f.state.finishError = true;
  assert.deepEqual(await f.run(), {
    ok: false,
    error: "GLF_DELETE_FILES_PENDING",
    pending: true,
  });
  const count = f.removed.length;
  f.state.done = true;
  assert.equal((await f.run()).ok, true);
  assert.equal(f.removed.length, count);
});
test("large letter histories are removed in bounded batches and only listed paths", async () => {
  const f = fixture();
  f.state.paths = Array.from({ length: 205 }, (_, i) => `letter-${i}.pdf`);
  assert.equal((await f.run()).ok, true);
  assert.deepEqual(
    f.removed.map((b) => b.length),
    [100, 100, 5],
  );
  assert.deepEqual(f.removed.flat(), f.state.paths);
});
