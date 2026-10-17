"use client";
import Link from "next/link";
import {
  UsersThreeIcon,
  SealCheckIcon,
  WalletIcon,
  SignOutIcon,
  PlusIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarDotsIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import { Badge, EmployeeName, PageHeading } from "@/components/ui/primitives";
import {
  currency,
  displayPeriod,
  displayDate,
  nextMonth,
} from "@/lib/domain/model";
import { eligibleEmployees } from "@/lib/domain/workflow";
export default function Overview() {
  const { state, today } = useApp();
  const eligible = eligibleEmployees(state, today);
  const pending = state.employees.filter((e) => e.approval === "Pending");
  const total = eligible.reduce((sum, e) => sum + e.salary, 0);
  const run = state.runs.find((r) => r.period === state.period);
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE & PAYROLL"
        title="Workforce overview"
        description="A clear view of your people, approvals, and payroll."
      />
      <section className="hero">
        <div>
          <div className="hero-label">
            <CalendarDotsIcon size={13} />
            Current payroll cycle
          </div>
          <h2>{displayPeriod(state.period)} payroll</h2>
          <p>
            {run
              ? `Payroll for ${displayPeriod(state.period)} is complete. A payroll lead can close the period to open ${displayPeriod(nextMonth(state.period + "-01"))}.`
              : "Review your workforce and prepare the next payroll run. Approved, eligible employees are included automatically."}
          </p>
        </div>
        <div className="hero-actions">
          {run && <Badge tone="green">Processed</Badge>}
          <Link className="button secondary" href="/payroll">
            <WalletIcon size={15} />
            View payroll
          </Link>
          <Link className="button secondary" href="/employees/new">
            <PlusIcon size={15} />
            New hire
          </Link>
          <Link
            href={run ? `/payroll/${run.id}` : "/payroll"}
            className="button"
          >
            {run ? "View run" : "Prepare payroll"}
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </section>
      <div className="metrics-grid">
        {[
          {
            label: "Employed workforce",
            value: state.employees
              .filter(
                (e) => e.employment === "Employed" && e.approval === "Approved",
              )
              .length.toString(),
            note: `${new Set(state.employees.map((e) => e.department)).size} departments`,
            icon: UsersThreeIcon,
          },
          {
            label: "Pending hire approvals",
            value: pending.length.toString().padStart(2, "0"),
            note: pending.length
              ? "Awaiting independent review"
              : "All approvals up to date",
            icon: SealCheckIcon,
          },
          {
            label: "Estimated payroll",
            value: currency(total),
            note: `${eligible.length} payroll-eligible employees`,
            icon: WalletIcon,
          },
          {
            label: "Recorded exits",
            value: state.exits.length.toString().padStart(2, "0"),
            note: "Exit records kept",
            icon: SignOutIcon,
          },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <div className="metric-top">
              {m.label}
              <m.icon size={17} />
            </div>
            <strong>{m.value}</strong>
            <small>{m.note}</small>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="surface">
          <div className="section-head">
            <div>
              <h2>Employee snapshot</h2>
              <p>Your workforce at a glance</p>
            </div>
            <Link href="/employees" className="text-link">
              All employees
              <ArrowUpRightIcon size={14} />
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.employees.slice(0, 5).map((e) => (
                  <tr key={e.id}>
                    <td>
                      <EmployeeName name={e.name} id={e.id} />
                    </td>
                    <td>{e.department}</td>
                    <td>
                      <Badge
                        tone={e.employment === "Employed" ? "green" : "neutral"}
                      >
                        {e.employment}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="surface">
          <div className="section-head">
            <div>
              <h2>Your workspace</h2>
              <p>Keep the process moving</p>
            </div>
          </div>
          {[
            {
              href: "/approvals",
              title: "Review new hires",
              text: `${pending.length} pending approval${pending.length === 1 ? "" : "s"}`,
              icon: SealCheckIcon,
            },
            {
              href: "/payroll",
              title: "Prepare monthly payroll",
              text: `${displayPeriod(state.period)} · ${eligible.length} eligible employees`,
              icon: WalletIcon,
            },
            {
              href: "/exits",
              title: "Manage employee exits",
              text: "Record exits and update payroll eligibility",
              icon: SignOutIcon,
            },
          ].map((t) => (
            <Link key={t.href} className="task" href={t.href}>
              <span className="task-icon">
                <t.icon size={17} />
              </span>
              <div className="task-copy">
                <strong>{t.title}</strong>
                <p>{t.text}</p>
              </div>
              <ArrowUpRightIcon size={15} />
            </Link>
          ))}
        </section>
      </div>
      <section className="surface process">
        <div className="section-head">
          <div>
            <h2>From hire to payroll</h2>
            <p>The normal process, in four steps</p>
          </div>
          <ShieldCheckIcon size={18} className="text-primary" />
        </div>
        <div className="process-steps">
          {[
            {
              title: "Create a hire",
              text: "Link employee details to an approved headcount requisition.",
            },
            {
              title: "Independent approval",
              text: "A second HR actor reviews and activates the record.",
            },
            {
              title: "Process payroll",
              text: "Pay all approved, payroll-eligible employees.",
            },
            {
              title: "Handle the exit",
              text: "Record the exit; approval deactivates payroll eligibility.",
            },
          ].map((s, i) => (
            <div className="process-step" key={s.title}>
              <span className="step-number">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {state.events.length > 0 && (
        <section className="surface section-gap">
          <div className="section-head">
            <h2>Recent activity</h2>
            <span className="count-note">Latest first</span>
          </div>
          <div className="timeline">
            {state.events
              .slice(-4)
              .reverse()
              .map((e) => (
                <div className="timeline-row" key={e.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>
                      {e.action} · {e.subjectId}
                    </strong>
                    <p>{e.note}</p>
                    <small>
                      {e.actor} · {displayDate(e.timestamp)}
                    </small>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
