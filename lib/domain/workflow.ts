import {
  Actor,
  Employee,
  PayrollRun,
  Scenario,
  SourceEvent,
  State,
  period,
  nextMonth,
  departments,
  banks,
} from "./model";
export type Action =
  | { type: "saveHire"; employee: Employee; submit: boolean }
  | {
      type: "editHire";
      id: string;
      name: string;
      job: string;
      manager: string;
      salary: number;
      requisition: string;
      taxId: string;
    }
  | { type: "submitHire"; id: string }
  | { type: "approve"; id: string }
  | { type: "return"; id: string; reason: string }
  | {
      type: "exit";
      id: string;
      lastWorkingDate: string;
      reason: string;
      delayed: boolean;
    }
  | { type: "correctEligibility"; id: string; reason: string }
  | {
      type: "correctBank";
      id: string;
      bank: string;
      account: string;
      reason: string;
    }
  | { type: "processPayroll" }
  | { type: "advancePeriod" };
function fail(message: string): never {
  throw new Error(message);
}
function requireRole(actor: Actor, allowed: Actor["role"][]): void {
  if (!allowed.includes(actor.role))
    fail(`Switch to ${allowed.join(" or ")} to perform this action.`);
}
function event(
  state: State,
  actor: Actor,
  action: string,
  subjectId: string,
  note: string,
): SourceEvent {
  return {
    id: `EVT-${String(state.events.length + 1).padStart(4, "0")}`,
    timestamp: state.date,
    actor: actor.name,
    action,
    subjectId,
    note,
  };
}
export function eligibleEmployees(state: State): Employee[] {
  return state.employees.filter(
    (e) => e.approval === "Approved" && e.eligible && e.startDate <= state.date,
  );
}
export function transition(state: State, action: Action, actor: Actor): State {
  const employee =
    "id" in action
      ? state.employees.find((e) => e.id === action.id)
      : undefined;
  if ("id" in action && !employee) fail("Employee record not found.");
  const change = (updated: Employee, title: string, note: string): State => ({
    ...state,
    employees: state.employees.map((e) => (e.id === updated.id ? updated : e)),
    events: [...state.events, event(state, actor, title, updated.id, note)],
  });
  switch (action.type) {
    case "editHire":
      requireRole(actor, ["HR Officer"]);
      if (!["Draft", "Returned"].includes(employee!.approval))
        fail("Only draft and returned hires can be edited.");
      if (
        ![
          action.name,
          action.job,
          action.manager,
          action.requisition,
          action.taxId,
        ].every((v) => v.trim()) ||
        !Number.isFinite(action.salary) ||
        action.salary <= 0
      )
        fail("Complete all hire fields with a positive salary.");
      return change(
        {
          ...employee!,
          name: action.name,
          job: action.job,
          manager: action.manager,
          salary: action.salary,
          requisition: action.requisition,
          taxId: action.taxId,
        },
        "Hire details corrected",
        "Draft/returned hire updated before resubmission.",
      );
    case "saveHire": {
      requireRole(actor, ["HR Officer"]);
      const e = action.employee;
      if (
        !e.name.trim() ||
        !e.job.trim() ||
        !e.manager.trim() ||
        !e.requisition.trim() ||
        !e.taxId.trim() ||
        !e.startDate ||
        !e.bank ||
        !/^\d{10}$/.test(e.account) ||
        !Number.isFinite(e.salary) ||
        e.salary <= 0
      )
        fail(
          "Complete all hire fields, including a 10-digit account and positive salary.",
        );
      if (state.employees.some((existing) => existing.id === e.id))
        fail("Employee ID already exists.");
      return {
        ...state,
        employees: [
          ...state.employees,
          {
            ...e,
            eligible: false,
            approval: action.submit ? "Pending" : "Draft",
            createdBy: actor.id,
            approverId: null,
            employment: "Employed",
          },
        ],
        events: [
          ...state.events,
          event(
            state,
            actor,
            action.submit ? "Hire submitted" : "Draft saved",
            e.id,
            "Approved requisition: " + e.requisition,
          ),
        ],
      };
    }
    case "submitHire":
      requireRole(actor, ["HR Officer"]);
      if (employee!.approval !== "Draft" && employee!.approval !== "Returned")
        fail("Only drafts and returned hires can be submitted.");
      return change(
        { ...employee!, approval: "Pending" },
        "Hire submitted",
        "Submitted for independent approval.",
      );
    case "approve":
      requireRole(actor, ["HR Approver"]);
      if (employee!.approval !== "Pending")
        fail("Only pending hires can be approved.");
      if (employee!.createdBy === actor.id)
        fail("A hire must be approved by a different HR actor.");
      return change(
        {
          ...employee!,
          approval: "Approved",
          eligible: true,
          approverId: actor.id,
        },
        "Hire approved",
        "Independent approval; employee activated for payroll.",
      );
    case "return":
      requireRole(actor, ["HR Approver"]);
      if (employee!.approval !== "Pending")
        fail("Only pending hires can be returned.");
      if (!action.reason.trim()) fail("Enter a return reason.");
      return change(
        { ...employee!, approval: "Returned", eligible: false },
        "Hire returned",
        action.reason,
      );
    case "exit": {
      requireRole(actor, ["HR Officer", "HR/Payroll Lead"]);
      if (employee!.employment === "Exited")
        fail("An exit has already been recorded.");
      if (employee!.approval !== "Approved")
        fail("Approve the hire before processing an exit.");
      if (
        !action.reason.trim() ||
        action.lastWorkingDate > state.date ||
        action.lastWorkingDate < employee!.startDate
      )
        fail(
          "Provide a reason and a last working date between the start date and simulation date.",
        );
      const updated = change(
        {
          ...employee!,
          employment: "Exited",
          eligible: action.delayed ? employee!.eligible : false,
          lastActivity: action.lastWorkingDate,
        },
        "Exit recorded",
        action.delayed
          ? "Simulated delayed synchronization: payroll eligibility remains active."
          : "Payroll eligibility deactivated.",
      );
      return {
        ...updated,
        exits: [
          ...state.exits,
          {
            id: `EXIT-${String(state.exits.length + 1).padStart(3, "0")}`,
            employeeId: employee!.id,
            lastWorkingDate: action.lastWorkingDate,
            reason: action.reason,
            processedDate: state.date,
            processedBy: actor.name,
            delayed: action.delayed,
          },
        ],
      };
    }
    case "correctEligibility":
      requireRole(actor, ["HR/Payroll Lead"]);
      if (!action.reason.trim()) fail("Enter the correction reason.");
      if (!employee!.eligible) fail("Payroll eligibility is already inactive.");
      return change(
        { ...employee!, eligible: false },
        "Payroll eligibility corrected",
        action.reason,
      );
    case "correctBank":
      requireRole(actor, ["HR Officer", "HR/Payroll Lead"]);
      if (
        !action.bank ||
        !/^\d{10}$/.test(action.account) ||
        !action.reason.trim()
      )
        fail("Provide a bank, a 10-digit account, and a reason.");
      return change(
        { ...employee!, bank: action.bank, account: action.account },
        "Bank details updated",
        action.reason + ". Historical payment accounts preserved.",
      );
    case "processPayroll": {
      requireRole(actor, ["Payroll Processor"]);
      if (state.runs.some((run) => run.period === period(state.date)))
        fail(
          "This period has already been processed. Advance to the next period.",
        );
      const eligible = eligibleEmployees(state);
      if (!eligible.length)
        fail("No approved employees are eligible for this period.");
      const id = `RUN-${period(state.date).replace("-", "")}`;
      const run: PayrollRun = {
        id,
        period: period(state.date),
        date: state.date,
        processedBy: actor.name,
        excludedIds: state.employees
          .filter((e) => !eligible.some((p) => p.id === e.id))
          .map((e) => e.id),
        payments: eligible.map((e, index) => ({
          id: `${id}-${index + 1}`,
          employeeId: e.id,
          employeeName: e.name,
          amount: e.salary,
          bank: e.bank,
          account: e.account,
          paymentDate: state.date,
          status: "Simulated paid",
        })),
      };
      return {
        ...state,
        runs: [...state.runs, run],
        events: [
          ...state.events,
          event(
            state,
            actor,
            "Payroll processed",
            id,
            `${eligible.length} simulated payments. No funds transferred.`,
          ),
        ],
      };
    }
    case "advancePeriod":
      return {
        ...state,
        date: nextMonth(state.date),
        events: [
          ...state.events,
          event(
            state,
            actor,
            "Simulation period advanced",
            "DEMO",
            nextMonth(state.date),
          ),
        ],
      };
  }
}
export function seed(scenario: Scenario): State {
  const names = [
    "Emeka Nwosu",
    "Blessing Hart",
    "Ibrahim Musa",
    "Adaobi Okeke",
    "David Briggs",
    "Fatima Lawal",
    "Chinedu Obi",
    "Grace Amadi",
    "Samuel George",
    "Aisha Bello",
    "Peter Johnson",
    "Ngozi Woko",
  ];
  const employees: Employee[] = names.map((name, i) => ({
    id: `EMP-${String(i + 1).padStart(3, "0")}`,
    name,
    department: departments[i % departments.length],
    job: [
      "Maintenance Technician",
      "Process Operator",
      "Mechanical Engineer",
      "Finance Analyst",
      "HR Specialist",
      "Safety Officer",
    ][i % 6],
    bank: banks[i % banks.length],
    account: `02100000${String(i + 1).padStart(2, "0")}`,
    taxId: `TIN-2026-${1000 + i}`,
    startDate: "2025-01-06",
    manager: ["Michael Brown", "Sarah Williams", "Okechukwu Eze"][i % 3],
    requisition: `HC-2025-${String(i + 1).padStart(3, "0")}`,
    salary: 420000 + i * 35000,
    employment: "Employed",
    eligible: true,
    approval: "Approved",
    createdBy: "HR-001",
    approverId: "HR-002",
    lastActivity: "2026-10-10",
  }));
  let state: State = {
    version: 1,
    scenario,
    date: "2026-10-12",
    employees,
    exits: [],
    runs: [],
    events: [],
  };
  if (scenario === "Seeded fallback") {
    const officer: Actor = {
      id: "HR-001",
      name: "Chukwudi Okafor",
      role: "HR Officer",
      initials: "CO",
    };
    state = transition(
      { ...state, date: "2026-07-21" },
      {
        type: "exit",
        id: "EMP-001",
        lastWorkingDate: "2026-07-20",
        reason: "Contract assignment completed",
        delayed: true,
      },
      officer,
    );
    state.employees[2] = {
      ...state.employees[2],
      bank: employees[1].bank,
      account: employees[1].account,
    };
    state.employees[3] = { ...state.employees[3], lastActivity: "2026-07-15" };
    for (const date of ["2026-08-28", "2026-09-28", "2026-10-12"]) {
      state = transition(
        { ...state, date },
        { type: "processPayroll" },
        {
          id: "PAY-001",
          name: "Tunde Bakare",
          role: "Payroll Processor",
          initials: "TB",
        },
      );
    }
    state.date = "2026-10-12";
  }
  return state;
}
function isEmployee(value: unknown): value is Employee {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    [
      "id",
      "name",
      "department",
      "job",
      "bank",
      "account",
      "taxId",
      "startDate",
      "manager",
      "requisition",
      "createdBy",
    ].every((k) => typeof e[k] === "string") &&
    typeof e.salary === "number" &&
    Number.isFinite(e.salary) &&
    e.salary > 0 &&
    typeof e.eligible === "boolean" &&
    ["Employed", "Exited"].includes(String(e.employment)) &&
    ["Draft", "Pending", "Approved", "Returned"].includes(String(e.approval)) &&
    (e.approverId === null || typeof e.approverId === "string") &&
    (e.lastActivity === null || typeof e.lastActivity === "string")
  );
}
export function parseState(raw: string): State | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const s = value as Record<string, unknown>;
    const strings = (v: unknown, keys: string[]): boolean =>
      !!v &&
      typeof v === "object" &&
      keys.every((k) => typeof (v as Record<string, unknown>)[k] === "string");
    if (
      s.version !== 1 ||
      ![
        "Clean baseline",
        "Ghost worker",
        "Shared account",
        "Seeded fallback",
      ].includes(String(s.scenario)) ||
      typeof s.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(s.date)
    )
      return null;
    if (
      !Array.isArray(s.employees) ||
      !s.employees.every(isEmployee) ||
      !Array.isArray(s.exits) ||
      !s.exits.every(
        (e) =>
          strings(e, [
            "id",
            "employeeId",
            "lastWorkingDate",
            "reason",
            "processedDate",
            "processedBy",
          ]) && typeof e.delayed === "boolean",
      )
    )
      return null;
    if (
      !Array.isArray(s.events) ||
      !s.events.every((e) =>
        strings(e, ["id", "timestamp", "actor", "action", "subjectId", "note"]),
      )
    )
      return null;
    if (
      !Array.isArray(s.runs) ||
      !s.runs.every(
        (r) =>
          strings(r, ["id", "period", "date", "processedBy"]) &&
          Array.isArray(r.excludedIds) &&
          r.excludedIds.every((id: unknown) => typeof id === "string") &&
          Array.isArray(r.payments) &&
          r.payments.every(
            (p: unknown) =>
              strings(p, [
                "id",
                "employeeId",
                "employeeName",
                "bank",
                "account",
                "paymentDate",
              ]) &&
              typeof (p as Record<string, unknown>).amount === "number" &&
              Number.isFinite((p as Record<string, unknown>).amount) &&
              (p as Record<string, unknown>).status === "Simulated paid",
          ),
      )
    )
      return null;
    return value as State;
  } catch {
    return null;
  }
}
