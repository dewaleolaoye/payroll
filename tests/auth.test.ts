import test from "node:test";
import assert from "node:assert/strict";
import { actors } from "../lib/domain/model";
import { accounts, authenticate, defaultPassword } from "../lib/auth/accounts";
test("every staff member has an account", () => {
  assert.deepEqual(
    accounts.map((a) => a.email),
    [
      "chukwudi.okafor@nlng.local",
      "amina.yusuf@nlng.local",
      "tunde.bakare@nlng.local",
      "ngozi.eze@nlng.local",
    ],
  );
});
test("correct credentials sign in as the matching staff member", () => {
  assert.equal(
    authenticate("amina.yusuf@nlng.local", defaultPassword)?.id,
    actors[1].id,
  );
});
test("email matching ignores case and surrounding whitespace", () => {
  assert.equal(
    authenticate("  Tunde.Bakare@NLNG.local ", defaultPassword)?.id,
    actors[2].id,
  );
});
test("wrong password, unknown email, or empty input is rejected", () => {
  assert.equal(authenticate("amina.yusuf@nlng.local", "wrong"), null);
  assert.equal(authenticate("nobody@nlng.local", defaultPassword), null);
  assert.equal(authenticate("", defaultPassword), null);
  assert.equal(authenticate("amina.yusuf@nlng.local", ""), null);
});
