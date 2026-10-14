# NLNG People & Payroll

An HR and payroll application built with Next.js 16.4 App Router, React, strict TypeScript, and Tailwind CSS 4. It covers the employee register, new hires with independent approval, exits, and monthly payroll runs.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:4343 and sign in.

## Accounts and roles

Staff accounts are defined in `lib/auth/accounts.ts` until a user database is integrated. Each account has one role:

- **HR Officer** (Chukwudi Okafor): creates and submits hires, edits bank details, records exits.
- **HR Approver** (Amina Yusuf): approves or returns submitted hires. A hire can't be approved by the person who created it.
- **Payroll Processor** (Tunde Bakare): processes payroll for the open period.
- **HR/Payroll Lead** (Ngozi Eze): records exits, corrects eligibility and bank details, and closes payroll periods.

## Payroll periods

All records use today's date. Payroll is processed once for the **open period**, which starts at the current month. After the run, the HR/Payroll Lead closes the period to open the next month. A period can't be processed before its month starts, and processed runs keep the salary and bank details from processing time.

## Data

Records are saved in the browser's local storage (key `nlng-payroll-v2`) with schema validation. They aren't shared between browsers or users. The app starts with 12 sample employees.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

## Structure

`app/` contains route-level views; `components/layout` and `components/ui` provide the shell and shared primitives; `features/app` holds the app state and session provider, and `features/workforce` the employee dialogs; `lib/domain` contains the pure workflow transitions and typed entities; `lib/auth` holds the account lookup. Styling lives in `app/globals.css` alongside Tailwind utilities.
