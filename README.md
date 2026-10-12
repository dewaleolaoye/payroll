# NLNG People & Payroll

A local HR/payroll source-system simulation built with Next.js 16.4 App Router, React functional components, strict TypeScript, and Tailwind CSS 4. Audit Monitoring is outside this application.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:4343. Select **Simulation controls** to load a scenario. Every scenario load replaces the current local snapshot after confirmation; export first to preserve a copy.

## Demo actors

Use the top-right actor menu or simulation controls:

- Chukwudi Okafor, HR Officer: create/submit hires, bank edits, exits.
- Amina Yusuf, HR Approver: independent hire approval or return.
- Tunde Bakare, Payroll Processor: process one simulated run per period.
- Ngozi Eze, HR/Payroll Lead: correct eligibility and bank details.

Role switching simulates authorization; this is not production authentication. State is saved in the current browser's local storage with schema validation. It is not shared between browsers or users. All people, bank accounts, tax IDs, activity, and payments are synthetic.

## Walkthroughs

**Clean baseline:** create hire → switch approver → approve → switch payroll processor → process → HR officer records exit → advance period → process → confirm exclusion.

**Ghost worker:** load Ghost worker → employee EMP-001 → record exit (delayed synchronization is enabled by this scenario) → payroll processor runs payroll → inspect employee Employment and Payroll history → HR/payroll lead corrects eligibility → advance period → process → confirm exclusion.

**Shared account:** load Shared account → New hire → Fill demo example → submit → approver approves → payroll processor processes → open run and compare EMP-001 and EMP-013 → lead changes new employee's bank account → advance/run again. Previous payment accounts remain unchanged.

**Seeded fallback:** preloads an exited eligible worker, two employees sharing a bank account, old activity evidence, and three historical payroll runs.

Exports contain versioned JSON source records and change events for future external integration. No external ingestion, detection, alerts, or audit cases are implemented. Account and salary values are snapshotted into payment records.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests cover approval/role boundaries, normal exits, ghost payments, shared accounts, payment immutability, period idempotency, future-start exclusions, returned-hire correction, persistence, and fallback reset reproducibility.

## Structure

`app/` contains thin route-level views; `components/layout` and `components/ui` provide shell and primitives; `features/` contains simulation context and employee dialogs; `lib/domain` contains pure source-system transitions and typed entities. Styling uses shared NLNG colors and reusable class patterns in `app/globals.css` alongside Tailwind utilities.
