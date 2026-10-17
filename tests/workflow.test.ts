import test from "node:test";
import assert from "node:assert/strict";
import { actors, Employee, State } from "../lib/domain/model";
import {
  Action,
  eligibleEmployees,
  parseState,
  seed,
  transition,
} from "../lib/domain/workflow";
const [officer, approver, payroll, lead] = actors;
const today = "2026-10-12";
const nextMonthDay = "2026-11-03";
const run = (
  state: State,
  action: Action,
  actor = officer,
  date = today,
): State => transition(state, action, actor, date, `${today}T09:00:00.000Z`);
const hire = (state: State): Employee => ({
  ...state.employees[0],
  id: "EMP-013",
  name: "Daniel Okoro",
  approval: "Draft",
  eligible: false,
  createdBy: officer.id,
  approverId: null,
  submittedAt: null,
  approvedAt: null,
  startDate: today,
  offerSignedDate: today,
});
test("seed opens the current month with no history", () => {
  const state = seed(today);
  assert.equal(state.period, "2026-10");
  assert.equal(state.employees.length, 12);
  assert.deepEqual([state.runs, state.exits, state.events], [[], [], []]);
});
test("hire needs independent approval before payment", () => {
  let state = run(seed(today), {
    type: "saveHire",
    employee: hire(seed(today)),
    submit: true,
  });
  assert.equal(eligibleEmployees(state, today).length, 12);
  assert.throws(() => run(state, { type: "approve", id: "EMP-013" }));
  assert.throws(() =>
    run(
      state,
      { type: "approve", id: "EMP-013" },
      {
        ...approver,
        id: officer.id,
      },
    ),
  );
  state = run(state, { type: "approve", id: "EMP-013" }, approver);
  state = run(state, { type: "processPayroll" }, payroll);
  assert.equal(state.runs[0].payments.length, 13);
  assert.ok(state.runs[0].payments.every((p) => p.status === "Paid"));
  assert.ok(state.runs[0].payments.every((p) => p.paymentDate === today));
});
test("a period can be processed only once", () => {
  const state = run(seed(today), { type: "processPayroll" }, payroll);
  assert.throws(
    () => run(state, { type: "processPayroll" }, payroll),
    /already been processed/,
  );
});
test("only the payroll lead can close a period, and only after its run", () => {
  let state = seed(today);
  assert.throws(
    () => run(state, { type: "closePeriod" }, lead),
    /Process payroll for this period/,
  );
  state = run(state, { type: "processPayroll" }, payroll);
  assert.throws(() => run(state, { type: "closePeriod" }, payroll));
  state = run(state, { type: "closePeriod" }, lead);
  assert.equal(state.period, "2026-11");
  assert.equal(state.events.at(-1)?.action, "Payroll period closed");
});
test("a period that hasn't started can't be processed", () => {
  let state = run(seed(today), { type: "processPayroll" }, payroll);
  state = run(state, { type: "closePeriod" }, lead);
  assert.throws(
    () => run(state, { type: "processPayroll" }, payroll),
    /hasn't started yet/,
  );
  state = run(state, { type: "processPayroll" }, payroll, nextMonthDay);
  assert.equal(state.runs[1].id, "RUN-202611");
  assert.equal(state.runs[1].date, nextMonthDay);
});
test("an approved exit deactivates eligibility and keeps earlier runs", () => {
  let state = run(seed(today), { type: "processPayroll" }, payroll);
  const snapshot = JSON.stringify(state.runs[0]);
  assert.throws(() =>
    run(state, {
      type: "exit",
      id: "EMP-001",
      lastWorkingDate: "2026-10-13",
      reason: "Assignment ended",
    }),
  );
  state = run(state, {
    type: "exit",
    id: "EMP-001",
    lastWorkingDate: today,
    reason: "Assignment ended",
  });
  state = run(state, { type: "approveExit", exitId: "EXIT-001" }, approver);
  assert.equal(state.exits[0].status, "Approved");
  assert.equal(state.employees[0].employment, "Exited");
  assert.equal(state.employees[0].eligible, false);
  state = run(state, { type: "closePeriod" }, lead);
  state = run(state, { type: "processPayroll" }, payroll, nextMonthDay);
  assert.equal(state.runs[1].payments.length, 11);
  assert.ok(state.runs[1].excludedIds.includes("EMP-001"));
  assert.equal(JSON.stringify(state.runs[0]), snapshot);
});
test("bank corrections apply to future runs and keep processed snapshots", () => {
  let state = run(seed(today), { type: "processPayroll" }, payroll);
  const original = state.employees[0].account;
  state = run(
    state,
    {
      type: "correctBank",
      id: "EMP-001",
      bank: "Zenith Bank",
      account: "0012345678",
      reason: "Verified account correction",
    },
    lead,
  );
  assert.equal(state.runs[0].payments[0].account, original);
  state = run(state, { type: "closePeriod" }, lead);
  state = run(state, { type: "processPayroll" }, payroll, nextMonthDay);
  assert.equal(state.runs[1].payments[0].account, "0012345678");
});
test("future-start hires and returned hires are excluded", () => {
  let state = run(seed(today), {
    type: "saveHire",
    employee: { ...hire(seed(today)), startDate: "2026-12-01" },
    submit: true,
  });
  state = run(state, { type: "approve", id: "EMP-013" }, approver);
  assert.equal(eligibleEmployees(state, today).length, 12);
  state = run(state, {
    type: "saveHire",
    employee: { ...hire(state), id: "EMP-014" },
    submit: true,
  });
  state = run(
    state,
    { type: "return", id: "EMP-014", reason: "Correct details" },
    approver,
  );
  assert.equal(eligibleEmployees(state, today).length, 12);
});
test("returned hire can be corrected and independently reapproved", () => {
  let state = run(seed(today), {
    type: "saveHire",
    employee: hire(seed(today)),
    submit: true,
  });
  state = run(
    state,
    { type: "return", id: "EMP-013", reason: "Incorrect role" },
    approver,
  );
  state = run(state, {
    type: "editHire",
    id: "EMP-013",
    name: "Daniel Okoro",
    job: "Process Technician",
    manager: "Michael Brown",
    salary: 480000,
    requisition: "HC-2026-091",
    taxId: "TIN-9001",
    offerSignedDate: today,
  });
  state = run(state, { type: "submitHire", id: "EMP-013" });
  state = run(state, { type: "approve", id: "EMP-013" }, approver);
  assert.equal(state.employees.at(-1)?.job, "Process Technician");
  assert.equal(state.employees.at(-1)?.eligible, true);
});
test("persistence round-trips and rejects old or malformed data", () => {
  let state = run(seed(today), { type: "processPayroll" }, payroll);
  state = run(state, {
    type: "exit",
    id: "EMP-002",
    lastWorkingDate: today,
    reason: "Resigned",
  });
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.equal(
    parseState(JSON.stringify({ ...state, version: 1, scenario: "x" })),
    null,
  );
  assert.equal(parseState(JSON.stringify({ ...state, version: 2 })), null);
  assert.equal(
    parseState(JSON.stringify({ ...state, runs: [{ id: "bad" }] })),
    null,
  );
  assert.deepEqual(seed(today), seed(today));
});

const recordExit = (state: State, id = "EMP-001", date = "2026-10-09") =>
  run(state, {
    type: "exit",
    id,
    lastWorkingDate: date,
    reason: "Contract terminated",
  });
test("a pending exit keeps the employee employed and paid", () => {
  let state = recordExit(seed(today));
  assert.equal(state.exits[0].status, "Pending");
  assert.equal(state.exits[0].recordedAt, "2026-10-12T09:00:00.000Z");
  assert.equal(state.employees[0].employment, "Employed");
  assert.equal(state.employees[0].eligible, true);
  state = run(state, { type: "processPayroll" }, payroll);
  assert.ok(state.runs[0].payments.some((p) => p.employeeId === "EMP-001"));
});
test("exit approval requires an independent HR Approver", () => {
  const state = recordExit(seed(today));
  assert.throws(() =>
    run(state, { type: "approveExit", exitId: "EXIT-001" }, officer),
  );
  assert.throws(() =>
    run(state, { type: "approveExit", exitId: "EXIT-001" }, lead),
  );
  assert.throws(
    () =>
      run(
        state,
        { type: "approveExit", exitId: "EXIT-001" },
        { ...approver, id: officer.id },
      ),
    /different HR actor/,
  );
  assert.throws(() => recordExit(state), /awaiting approval/);
});
test("a returned exit leaves the employee eligible and can be re-recorded", () => {
  let state = recordExit(seed(today));
  state = run(
    state,
    { type: "returnExit", exitId: "EXIT-001", reason: "Wrong date" },
    approver,
  );
  assert.equal(state.exits[0].status, "Returned");
  assert.equal(state.exits[0].returnReason, "Wrong date");
  assert.equal(state.employees[0].eligible, true);
  state = recordExit(state, "EMP-001", today);
  assert.equal(state.exits[1].status, "Pending");
});
test("late approvals are accepted without SLA checks", () => {
  let state = run(seed(today), {
    type: "saveHire",
    employee: { ...hire(seed(today)), offerSignedDate: "2026-10-02" },
    submit: true,
  });
  assert.equal(state.employees.at(-1)?.submittedAt, "2026-10-12T09:00:00.000Z");
  state = run(state, { type: "approve", id: "EMP-013" }, approver);
  assert.equal(state.employees.at(-1)?.approval, "Approved");
  assert.equal(state.employees.at(-1)?.approvedAt, "2026-10-12T09:00:00.000Z");
  assert.throws(() =>
    run(state, {
      type: "saveHire",
      employee: {
        ...hire(state),
        id: "EMP-014",
        offerSignedDate: "2026-10-13",
      },
      submit: true,
    }),
  );
});
