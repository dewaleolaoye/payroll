import test from "node:test";
import assert from "node:assert/strict";
import { actors } from "../lib/domain/model";
import { accounts, authenticate, demoPassword } from "../lib/auth/accounts";
test("every persona has a demo account", () => {
  assert.deepEqual(
    accounts.map((a) => a.email),
    [
      "chukwudi.okafor@nlng.demo",
      "amina.yusuf@nlng.demo",
      "tunde.bakare@nlng.demo",
      "ngozi.eze@nlng.demo",
    ],
  );
});
test("correct credentials sign in as the matching persona", () => {
  assert.equal(
    authenticate("amina.yusuf@nlng.demo", demoPassword)?.id,
    actors[1].id,
  );
});
test("email matching ignores case and surrounding whitespace", () => {
  assert.equal(
    authenticate("  Tunde.Bakare@NLNG.demo ", demoPassword)?.id,
    actors[2].id,
  );
});
test("wrong password, unknown email, or empty input is rejected", () => {
  assert.equal(authenticate("amina.yusuf@nlng.demo", "wrong"), null);
  assert.equal(authenticate("nobody@nlng.demo", demoPassword), null);
  assert.equal(authenticate("", demoPassword), null);
  assert.equal(authenticate("amina.yusuf@nlng.demo", ""), null);
});
