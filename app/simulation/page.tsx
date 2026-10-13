"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  DownloadSimpleIcon,
  UsersThreeIcon,
  UserMinusIcon,
  CopyIcon,
  DatabaseIcon,
  CheckIcon,
  CalendarDotsIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import { Badge, Modal, PageHeading } from "@/components/ui/primitives";
import { Scenario, displayDate, scenarios } from "@/lib/domain/model";
export default function Simulation() {
  const { state, actor, signOut, reset, exportData, act } = useSimulation();
  const [selected, setSelected] = useState<Scenario | null>(null);
  const cards = [
    {
      title: "Clean baseline" as const,
      icon: UsersThreeIcon,
      text: "Create a hire, obtain independent approval, process payroll, and handle a normal exit.",
    },
    {
      title: "Ghost worker" as const,
      icon: UserMinusIcon,
      text: "Record an exit with delayed payroll synchronization. The exited worker remains eligible and receives a simulated payment.",
    },
    {
      title: "Shared account" as const,
      icon: CopyIcon,
      text: "Create and approve a distinct employee using an existing account, then pay both records into that account.",
    },
    {
      title: "Seeded fallback" as const,
      icon: DatabaseIcon,
      text: "Load historical source records with a ghost worker, a shared account, and old activity evidence. Ready for a live demonstration.",
    },
  ];
  const exit = state.exits.find((e) => e.employeeId === "EMP-001");
  const exitRun = state.runs.find((r) =>
    r.payments.some(
      (p) =>
        p.employeeId === "EMP-001" &&
        !!exit &&
        p.paymentDate > exit.lastWorkingDate,
    ),
  );
  const newHire = state.employees.find(
    (e) => !/^EMP-00[1-9]$|^EMP-01[0-2]$/.test(e.id),
  );
  const sharedRun = state.runs.find((r) =>
    r.payments.some((p, i) =>
      r.payments.some(
        (other, j) =>
          i !== j && other.bank === p.bank && other.account === p.account,
      ),
    ),
  );
  const steps =
    state.scenario === "Ghost worker"
      ? [
          {
            title: "Record the contractor’s exit",
            text: "HR Officer · choose Emeka Nwosu; synchronization is deliberately delayed.",
            href: "/employees/EMP-001",
            done: !!exit,
          },
          {
            title: "Process the payroll period",
            text: "Payroll Processor · the stale eligible record is paid.",
            href: "/payroll",
            done: !!exitRun,
          },
          {
            title: "Inspect the source evidence",
            text: "Employee detail · Employment and Payroll history tabs.",
            href: "/employees/EMP-001",
            done: false,
          },
          {
            title: "Correct eligibility",
            text: "HR/Payroll Lead · deactivate the employee’s payroll eligibility.",
            href: "/employees/EMP-001",
            done: !!exit && !state.employees[0].eligible,
          },
          {
            title: "Run the next period",
            text: "Advance the clock; verify the exited employee is excluded.",
            href: "/payroll",
            done: state.runs.some((r) => r.excludedIds.includes("EMP-001")),
          },
        ]
      : state.scenario === "Shared account"
        ? [
            {
              title: "Create a new hire",
              text: "HR Officer · use Fill demo example to copy an existing account.",
              href: "/employees/new",
              done: !!newHire,
            },
            {
              title: "Approve the new record",
              text: "HR Approver · review and activate the hire.",
              href: "/approvals",
              done: newHire?.approval === "Approved",
            },
            {
              title: "Process payroll",
              text: "Payroll Processor · both distinct employee IDs are paid.",
              href: "/payroll",
              done: !!sharedRun,
            },
            {
              title: "Inspect and correct bank details",
              text: "HR/Payroll Lead · source edits preserve previous payments.",
              href: newHire ? `/employees/${newHire.id}` : "/employees",
              done:
                !!newHire &&
                state.events.some(
                  (e) =>
                    e.subjectId === newHire.id &&
                    e.action === "Bank details updated",
                ),
            },
          ]
        : state.scenario === "Seeded fallback"
          ? [
              {
                title: "Inspect the ghost-worker source",
                text: "Emeka Nwosu · recorded exit and continued payments.",
                href: "/employees/EMP-001",
                done: true,
              },
              {
                title: "Inspect the shared-account source",
                text: "Blessing Hart and Ibrahim Musa share demo bank details.",
                href: "/employees/EMP-003",
                done: true,
              },
              {
                title: "View payroll snapshots",
                text: "Three historical periods of simulated payments.",
                href: "/payroll",
                done: true,
              },
            ]
          : [
              {
                title: "Create and submit a hire",
                text: "HR Officer · approved requisition and synthetic bank details.",
                href: "/employees/new",
                done: !!newHire,
              },
              {
                title: "Complete independent approval",
                text: "HR Approver · activate the submitted hire.",
                href: "/approvals",
                done: newHire?.approval === "Approved",
              },
              {
                title: "Process payroll",
                text: "Payroll Processor · only approved, eligible records are paid.",
                href: "/payroll",
                done: state.runs.length > 0,
              },
              {
                title: "Record a normal exit",
                text: "HR Officer · eligibility is deactivated immediately.",
                href: "/exits",
                done: state.exits.length > 0,
              },
              {
                title: "Verify exclusion next period",
                text: "Advance the simulation clock and process payroll again.",
                href: "/payroll",
                done: state.runs.some((r) =>
                  r.excludedIds.some((id) =>
                    state.exits.some(
                      (e) => e.employeeId === id && r.date > e.lastWorkingDate,
                    ),
                  ),
                ),
              },
            ];
  return (
    <>
      <PageHeading
        eyebrow="EXPERIENCE CENTER · SCENARIO 09"
        title="Simulation controls"
        description="Set the scene, sign in as each persona, and replay the source-system process."
      >
        <button className="button secondary" onClick={exportData}>
          <DownloadSimpleIcon size={14} />
          Export source data
        </button>
        <button
          className="button secondary"
          onClick={() => setSelected(state.scenario)}
        >
          <ArrowCounterClockwiseIcon size={14} />
          Reset current demo
        </button>
      </PageHeading>
      <div className="notice">
        This application simulates HR and payroll source records. The external
        Audit Monitoring tool is outside this build. Export does not imply
        ingestion or detection.
      </div>
      <section className="surface">
        <div className="section-head">
          <div>
            <h2>Presenter workspace</h2>
            <p>All dates and workflow actions use the simulation clock</p>
          </div>
          <Badge tone="green">{state.scenario}</Badge>
        </div>
        <div className="form-grid form-section">
          <div>
            <label>Signed-in persona</label>
            <div className="flex items-center gap-3 mt-2">
              <span className="avatar small">{actor.initials}</span>
              <span className="flex-1">
                <strong>{actor.name}</strong> · {actor.role}
              </span>
              <button className="button secondary small" onClick={signOut}>
                <SignOutIcon size={13} />
                Sign out to switch
              </button>
            </div>
          </div>
          <div>
            <label>Simulation date</label>
            <div className="flex items-center gap-3 mt-2">
              <span className="mono">{displayDate(state.date)}</span>
              <button
                className="button secondary small"
                onClick={() => act({ type: "advancePeriod" })}
              >
                <CalendarDotsIcon size={13} />
                Advance one period
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className="scenario-grid">
        {cards.map((c) => (
          <section
            key={c.title}
            className={`surface scenario-card ${state.scenario === c.title ? "selected" : ""}`}
          >
            <div className="flex justify-between w-full items-center">
              <c.icon size={23} className="text-primary" />
              {state.scenario === c.title && (
                <Badge tone="green">Current scenario</Badge>
              )}
            </div>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <button
              className="button secondary"
              onClick={() => setSelected(c.title)}
            >
              {state.scenario === c.title
                ? "Restart scenario"
                : "Load scenario"}
              <ArrowRightIcon size={13} />
            </button>
          </section>
        ))}
      </div>
      <section className="surface">
        <div className="section-head">
          <div>
            <h2>{state.scenario} walkthrough</h2>
            <p>
              Progress reflects the actual source records and completed actions
            </p>
          </div>
        </div>
        <div className="guide-list">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`guide-item ${s.done ? "complete" : ""}`}
            >
              <span>{s.done ? <CheckIcon size={13} /> : i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
              <Link href={s.href} className="text-link">
                Open
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      {selected && (
        <Modal
          title={`Load ${selected.toLowerCase()}?`}
          description="This replaces the current demo with its starting snapshot. Generated hires, exits, payroll runs, and source history will be cleared. Export first if you want to keep them."
          onClose={() => setSelected(null)}
        >
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
            <button
              className="button"
              onClick={() => {
                if (scenarios.includes(selected)) reset(selected);
                setSelected(null);
              }}
            >
              Load and reset
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
