# Payroll — screens and replayable simulation

## Scope

Build only the mock HR/Payroll source application for Scenario 9. Audit Monitoring is an external system and is outside this build. Do not implement audit dashboards, detection rules, exceptions, risk scoring, referrals, or case management.

The simulation must create believable records for the clean hire-to-payroll flow, a ghost worker, and employees sharing a bank account. Preserve source evidence so the external monitoring tool can consume it once its integration contract is supplied. No external integration is assumed to exist.

## Proposed screens

| Screen / route                     | Main content and actions                                                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview `/`                       | Workforce totals, pending approvals, current payroll period, recent HR actions, and quick links. Use this and payroll preview to narrate the baseline in under 30 seconds.                   |
| Employees `/employees`             | Searchable register; department, approval status, HR employment status, payroll eligibility; create hire and open record.                                                                    |
| New hire `/employees/new`          | Name, role, department, bank name/account, tax ID, start date, manager, approved headcount requisition, and simulated salary. Save draft or submit for approval.                             |
| Employee detail `/employees/[id]`  | Separate HR status and payroll eligibility; bank details; approval history; exit records; activity evidence; payment history. Role-appropriate edit, exit, and payroll correction actions.   |
| Hire approvals `/approvals`        | Pending queue and hire detail panel; approve or return with reason. Only a second HR approver can activate a submitted hire; prevent self-approval.                                          |
| Exits `/exits`                     | Record exit, last working date, reason, processed date/by, and payroll synchronization state. Normal processing deactivates eligibility. Demo controls can simulate delayed synchronization. |
| Payroll runs `/payroll`            | Run history, period selector, eligible employees and exclusions, totals, and Process simulated payroll action.                                                                               |
| Payroll run detail `/payroll/[id]` | Payment rows with employee, amount, bank used, payment date/status, and employee links. Preserve the values used at processing time.                                                         |
| Simulation controls `/simulation`  | Clean baseline, Ghost worker, Shared account, and Seeded fallback; role switcher, simulation clock, guided steps, reset, and source-data export.                                             |

Exit creation can be a modal shared between employee detail and the exit register. Approval review can use a detail panel. Keep the employee record central to exploration and evidence navigation.

## Roles

- HR officer: creates hires, edits source records, and processes exits.
- Second HR approver: reviews and approves submitted hires.
- Payroll processor: previews and processes simulated payroll.
- HR/payroll lead: performs business corrections to eligibility or account details.
- Presenter: selects scenarios, switches actors, advances time, and resets the demonstration.

Role switching is a simulation feature, not production authentication. Enforce the selected role's permissions in action handlers as well as the UI.

## Replayable flows

### Clean baseline

1. Start with 12 approved active employees across multiple departments, unique bank accounts, and recent synthetic activity.
2. Create and submit a hire as HR officer.
3. Switch to the second HR approver and approve; payroll eligibility becomes Active.
4. Switch to payroll processor and process the period; the approved hire receives a simulated payment.
5. Record a normal exit; eligibility becomes Inactive.
6. Advance to the next period and process payroll; the exited employee is excluded.

The presenter can narrate steps 2–5 using preloaded records and show overview plus payroll preview within 30 seconds. The full flow remains interactive for exploration.

### Ghost worker

1. Open an active contractor and record an exit effective before the next payment date.
2. Use the presenter-controlled delayed payroll synchronization condition: HR records the exit while payroll eligibility stays Active. Label this condition clearly in simulation controls.
3. Preview and process payroll; the stale eligible record receives a simulated payment.
4. Show the employee's exit evidence alongside its payroll eligibility and payment history. Make these source records available for external monitoring.
5. As HR/payroll lead, correct payroll eligibility in the source application.
6. Advance the period and run payroll again; the employee is excluded. Prior payments remain unchanged.

Also preload an activity-only example with old synthetic attendance/site-access data. Preserve the activity dates for the external tool; this app does not evaluate an inactivity tolerance or raise an exception.

### Shared bank account

1. Create a distinct new employee using an existing active employee's bank name and account number.
2. Approve the hire with the second HR approver. The source app permits this scenario so it can be demonstrated.
3. Preview and process payroll; both employee IDs receive simulated payments into the same account.
4. Open each employee and the payroll run to show the source details. Export or later integrate these records with the external tool.
5. As HR/payroll lead, correct the account or deactivate the inappropriate record after the business investigation is narrated externally.
6. Run the next period to demonstrate the source correction without rewriting historical payments.

### Seeded fallback

Provide a separate resettable snapshot with 12 clean employees, 1–2 ghost examples, and 1–2 shared-account examples, plus historical payroll periods. These are source records, not prebuilt audit cases. The presenter can reproduce the anomaly without live form entry.

## State and evidence

Model employee, hire approval, exit, activity, payroll run, payment row, and source-change event as explicitly typed entities. HR employment status, approval status, and payroll eligibility must be separate: one Active/Inactive flag cannot recreate a ghost worker.

Use a deterministic simulation clock and explicit advance-period action. Generate payment rows from approved, payroll-eligible records. Snapshot salary, bank name, and account number when a run is processed. Store accounts as strings to retain leading zeroes. Prevent processing the same run twice; retries must not duplicate payments.

Record actor, timestamp, action, reason, and source IDs for hires, approvals, exits, bank edits, payroll runs, and corrections. Keep historical payment records immutable. Use versioned validated local persistence so refresh preserves progress. Reset restores the selected seed and clears generated simulation history after confirmation.

Provide a versioned JSON export containing employees, approvals, exits, activity, payroll runs, payments, and change history. This is a proposed handoff format; the actual API, delivery method, and schema depend on the external monitoring tool's contract. Export success must not imply external ingestion or detection. Maintain stable IDs and source routes for future drill-down links.

All data and payments are synthetic. Display a persistent Simulation badge; payroll processing produces no actual payment or settlement.

## Proposed folder and styling conventions

The stack and folder pattern in the request are placeholders. Proposed implementation uses Next.js App Router, strict TypeScript, functional components, and Tailwind; pin the framework version when implementation begins.

```text
payroll/
  app/
    page.tsx
    employees/page.tsx
    employees/new/page.tsx
    employees/[id]/page.tsx
    approvals/page.tsx
    exits/page.tsx
    payroll/page.tsx
    payroll/[id]/page.tsx
    simulation/page.tsx
    layout.tsx
    globals.css
  components/
    layout/
    ui/
  features/
    workforce/
    approvals/
    exits/
    payroll/
    simulation/
  lib/
    domain/
    formatting/
    export/
  tests/
  public/
```

Keep route files thin and domain transitions in typed functions. Use explicit interfaces and discriminated unions; no `any`. Validate persisted/imported values from `unknown` before use.

Follow the neighboring NLNG apps' visual direction: deep-green navigation, white surfaces, pale-green highlights, restrained borders, and legible tables. Centralize color, spacing, and typography tokens in globals.css and use Tailwind consistently. Provide responsive views, keyboard-accessible dialogs, visible focus, associated labels, and status text alongside colors.

## Delivery and verification

1. Build typed source entities, seeds, role permissions, clock, and persistence.
2. Build employee creation, second-person approval, exits, and payroll processing.
3. Add scenario setup, delayed synchronization, fallback snapshots, reset, and export.
4. Verify clean flow, ghost flow, shared-account flow, and business corrections from beginning to end.

Acceptance: pending hires cannot be paid; self-approval is prevented; normal exits exclude future payment; delayed synchronization allows a post-exit simulated payment; two approved distinct employees can be paid into one account; corrections affect future runs only; retries do not duplicate payments; refresh preserves state; reset reproduces the initial snapshot; exports contain the actual generated records. Run strict type checking and a production build when implementation exists.
