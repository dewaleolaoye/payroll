import test from "node:test";
import assert from "node:assert/strict";
import { actors, Employee } from "../lib/domain/model";
import {
  eligibleEmployees,
  parseState,
  seed,
  transition,
} from "../lib/domain/workflow";
const [officer, approver, payroll, lead] = actors;
const hire = (state: ReturnType<typeof seed>): Employee => ({
  ...state.employees[0],
  id: "EMP-013",
  name: "Daniel Okoro",
  approval: "Draft",
  eligible: false,
  createdBy: officer.id,
  approverId: null,
  startDate: state.date,
});
test("hire needs independent approval before simulated payment", () => {
  let state = seed("Clean baseline");
  state = transition(
    state,
    { type: "saveHire", employee: hire(state), submit: true },
    officer,
  );
  assert.equal(eligibleEmployees(state).length, 12);
  assert.throws(() =>
    transition(state, { type: "approve", id: "EMP-013" }, officer),
  );
  assert.throws(() =>
    transition(
      state,
      { type: "approve", id: "EMP-013" },
      { ...approver, id: officer.id },
    ),
  );
  state = transition(state, { type: "approve", id: "EMP-013" }, approver);
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.equal(state.runs[0].payments.length, 13);
  assert.throws(() => transition(state, { type: "processPayroll" }, payroll));
});
test("normal exit excludes worker from the next period and preserves previous run", () => {
  let state = transition(
    seed("Clean baseline"),
    { type: "processPayroll" },
    payroll,
  );
  const snapshot = JSON.stringify(state.runs[0]);
  state = transition(
    state,
    {
      type: "exit",
      id: "EMP-001",
      lastWorkingDate: "2026-10-12",
      reason: "Assignment ended",
      delayed: false,
    },
    officer,
  );
  state = transition(state, { type: "advancePeriod" }, payroll);
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.equal(state.runs[1].payments.length, 11);
  assert.ok(state.runs[1].excludedIds.includes("EMP-001"));
  assert.equal(JSON.stringify(state.runs[0]), snapshot);
});
test("ghost worker receives post-exit payment until business lead corrects eligibility", () => {
  let state = seed("Ghost worker");
  state = transition(
    state,
    {
      type: "exit",
      id: "EMP-001",
      lastWorkingDate: "2026-09-20",
      reason: "Assignment ended",
      delayed: true,
    },
    officer,
  );
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.equal(state.employees[0].employment, "Exited");
  assert.equal(state.employees[0].eligible, true);
  assert.ok(
    state.runs[0].payments.some(
      (p) =>
        p.employeeId === "EMP-001" &&
        p.paymentDate > state.exits[0].lastWorkingDate,
    ),
  );
  assert.throws(() =>
    transition(
      state,
      { type: "correctEligibility", id: "EMP-001", reason: "Fix" },
      payroll,
    ),
  );
  state = transition(
    state,
    { type: "correctEligibility", id: "EMP-001", reason: "Confirmed exit" },
    lead,
  );
  state = transition(state, { type: "advancePeriod" }, lead);
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.ok(!state.runs[1].payments.some((p) => p.employeeId === "EMP-001"));
});
test("shared account can be paid for two employee IDs; account corrections keep snapshot", () => {
  let state = seed("Shared account");
  const original = state.employees[0].account;
  state = transition(
    state,
    { type: "saveHire", employee: hire(state), submit: true },
    officer,
  );
  state = transition(state, { type: "approve", id: "EMP-013" }, approver);
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.equal(
    state.runs[0].payments.filter(
      (p) => p.account === original && p.bank === state.employees[0].bank,
    ).length,
    2,
  );
  state = transition(
    state,
    {
      type: "correctBank",
      id: "EMP-013",
      bank: "Zenith Bank",
      account: "0012345678",
      reason: "Verified account correction",
    },
    lead,
  );
  assert.equal(
    state.runs[0].payments.find((p) => p.employeeId === "EMP-013")?.account,
    original,
  );
  state = transition(state, { type: "advancePeriod" }, payroll);
  state = transition(state, { type: "processPayroll" }, payroll);
  assert.equal(
    state.runs[1].payments.find((p) => p.employeeId === "EMP-013")?.account,
    "0012345678",
  );
});
test("future-start hires and returned hires are excluded", () => {
  let state = seed("Clean baseline");
  state = transition(
    state,
    {
      type: "saveHire",
      employee: { ...hire(state), startDate: "2026-12-01" },
      submit: true,
    },
    officer,
  );
  state = transition(state, { type: "approve", id: "EMP-013" }, approver);
  assert.equal(eligibleEmployees(state).length, 12);
  const second = { ...hire(state), id: "EMP-014" };
  state = transition(
    state,
    { type: "saveHire", employee: second, submit: true },
    officer,
  );
  state = transition(
    state,
    { type: "return", id: "EMP-014", reason: "Correct details" },
    approver,
  );
  assert.equal(eligibleEmployees(state).length, 12);
});
test("fallback snapshot has source evidence and validated persistence survives round trip", () => {
  const state = seed("Seeded fallback");
  assert.equal(state.runs.length, 3);
  assert.ok(
    state.employees[0].eligible && state.employees[0].employment === "Exited",
  );
  assert.equal(state.employees[1].account, state.employees[2].account);
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.equal(parseState('{"version":1}'), null);
  assert.equal(
    parseState(JSON.stringify({ ...state, runs: [{ id: "bad" }] })),
    null,
  );
  assert.deepEqual(seed("Clean baseline"), seed("Clean baseline"));
});
test("returned hire can be corrected and independently reapproved", () => {
  let state = seed("Clean baseline");
  state = transition(
    state,
    { type: "saveHire", employee: hire(state), submit: true },
    officer,
  );
  state = transition(
    state,
    { type: "return", id: "EMP-013", reason: "Incorrect role" },
    approver,
  );
  state = transition(
    state,
    {
      type: "editHire",
      id: "EMP-013",
      name: "Daniel Okoro",
      job: "Process Technician",
      manager: "Michael Brown",
      salary: 480000,
      requisition: "HC-2026-091",
      taxId: "TIN-DEMO-9001",
    },
    officer,
  );
  state = transition(state, { type: "submitHire", id: "EMP-013" }, officer);
  state = transition(state, { type: "approve", id: "EMP-013" }, approver);
  assert.equal(state.employees.at(-1)?.job, "Process Technician");
  assert.equal(state.employees.at(-1)?.eligible, true);
});
