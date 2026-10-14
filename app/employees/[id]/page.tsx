"use client";
import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  SignOutIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import { Badge, Empty, PageHeading } from "@/components/ui/primitives";
import { currency, displayDate, displayPeriod } from "@/lib/domain/model";
import {
  BankDialog,
  CorrectionDialog,
  ExitDialog,
  HireEditDialog,
} from "@/features/workforce/RecordDialogs";
export default function EmployeeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state, actor, act } = useApp();
  const [tab, setTab] = useState("Profile");
  const [dialog, setDialog] = useState<
    "exit" | "bank" | "correct" | "hire" | null
  >(null);
  const e = state.employees.find((e) => e.id === id);
  if (!e)
    return (
      <Empty
        title="Employee not found"
        text="This employee record doesn’t exist. Open the employee register."
        href="/employees"
        action="View employees"
      />
    );
  const exits = state.exits.filter((x) => x.employeeId === id);
  const payments = state.runs.flatMap((r) =>
    r.payments
      .filter((p) => p.employeeId === id)
      .map((p) => ({ ...p, runId: r.id, period: r.period })),
  );
  const canEdit =
    actor.role === "HR Officer" || actor.role === "HR/Payroll Lead";
  const fields =
    tab === "Profile"
      ? [
          ["Employee ID", e.id],
          ["Department", e.department],
          ["Job role", e.job],
          ["Reporting manager", e.manager],
          ["Tax ID", e.taxId],
          ["Monthly salary", currency(e.salary)],
        ]
      : tab === "Employment"
        ? [
            ["Start date", displayDate(e.startDate)],
            ["Headcount requisition", e.requisition],
            ["Approval status", e.approval],
            ["Created by", e.createdBy],
            ["Approver ID", e.approverId ?? "Awaiting approval"],
            ["Employment status", e.employment],
          ]
        : [
            ["Bank name", e.bank],
            ["Account number", e.account],
            ["Monthly salary", currency(e.salary)],
          ];
  return (
    <>
      <Link className="back-link" href="/employees">
        <ArrowLeftIcon size={14} />
        Employee register
      </Link>
      <PageHeading
        eyebrow="EMPLOYEE RECORD"
        title={e.name}
        description={`${e.id} · ${e.job} · Bonny Island`}
      >
        <button
          className="button secondary"
          onClick={() => setDialog("bank")}
          disabled={!canEdit}
        >
          <PencilSimpleIcon size={14} />
          Edit bank details
        </button>
        {e.employment === "Employed" && e.approval === "Approved" && (
          <button
            className="button secondary"
            disabled={!canEdit}
            onClick={() => setDialog("exit")}
          >
            <SignOutIcon size={14} />
            Record exit
          </button>
        )}
        {e.eligible && actor.role === "HR/Payroll Lead" && (
          <button className="button" onClick={() => setDialog("correct")}>
            Correct eligibility
          </button>
        )}
        {["Draft", "Returned"].includes(e.approval) && (
          <button
            className="button secondary"
            disabled={actor.role !== "HR Officer"}
            onClick={() => setDialog("hire")}
          >
            <PencilSimpleIcon size={14} />
            Edit hire
          </button>
        )}
        {["Draft", "Returned"].includes(e.approval) && (
          <button
            className="button"
            disabled={actor.role !== "HR Officer"}
            onClick={() => act({ type: "submitHire", id })}
          >
            <PaperPlaneTiltIcon size={14} />
            Submit for approval
          </button>
        )}
      </PageHeading>
      {e.approval !== "Approved" && (
        <div className="notice">
          {e.approval === "Pending"
            ? "Awaiting independent approval. This employee is excluded from payroll."
            : `${e.approval} hire. Submit this record for approval before payroll activation.`}
          <Link href="/approvals" className="text-link ml-auto">
            Hire approvals →
          </Link>
        </div>
      )}
      <section className="surface detail-summary">
        <span className="avatar">
          {e.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <h2>{e.name}</h2>
          <p>
            {e.department} · {e.manager}
          </p>
        </div>
        <div className="status-group">
          <div>
            <small>HR EMPLOYMENT</small>
            <Badge tone={e.employment === "Employed" ? "green" : "neutral"}>
              {e.employment}
            </Badge>
          </div>
          <div>
            <small>PAYROLL ELIGIBILITY</small>
            <Badge tone={e.eligible ? "green" : "neutral"}>
              {e.eligible ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <small>HIRE APPROVAL</small>
            <Badge tone={e.approval === "Approved" ? "green" : "amber"}>
              {e.approval}
            </Badge>
          </div>
        </div>
      </section>
      <div className="tabs" role="tablist" aria-label="Employee sections">
        {[
          "Profile",
          "Employment",
          "Bank details",
          "Payroll history",
          "Activity",
        ].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {["Profile", "Employment", "Bank details"].includes(tab) && (
        <section className="surface">
          <div className="section-head">
            <h2>
              {tab === "Profile"
                ? "Employee information"
                : tab === "Employment"
                  ? "Employment & approval"
                  : "Bank information"}
            </h2>
            <ShieldCheckIcon size={16} className="text-primary" />
          </div>
          <div className="detail-grid">
            {fields.map(([label, value]) => (
              <div className="detail-field" key={label}>
                <small>{label}</small>
                <strong className={label.includes("number") ? "mono" : ""}>
                  {value}
                </strong>
              </div>
            ))}
          </div>
          {tab === "Employment" &&
            exits.map((x) => (
              <div className="form-section" key={x.id}>
                <h2>Exit record · {x.id}</h2>
                <div className="detail-grid" style={{ padding: "20px 0 0" }}>
                  {[
                    ["Last working date", displayDate(x.lastWorkingDate)],
                    ["Reason", x.reason],
                    ["Processed date", displayDate(x.processedDate)],
                    ["Processed by", x.processedBy],
                  ].map(([label, value]) => (
                    <div className="detail-field" key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}
      {tab === "Payroll history" && (
        <section className="surface">
          <div className="section-head">
            <h2>Payment history</h2>
            <span className="count-note">{payments.length} payments</span>
          </div>
          {payments.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Amount paid</th>
                    <th>Bank / account used</th>
                    <th>Payment date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          className="text-link"
                          href={`/payroll/${p.runId}`}
                        >
                          {displayPeriod(p.period)} ↗
                        </Link>
                      </td>
                      <td>{currency(p.amount)}</td>
                      <td>
                        {p.bank}
                        <span className="block mono text-muted mt-1">
                          {p.account}
                        </span>
                      </td>
                      <td>{displayDate(p.paymentDate)}</td>
                      <td>
                        <Badge tone="green">{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No payments recorded"
              text="Process a payroll run to generate payment history."
              href="/payroll"
              action="View payroll"
            />
          )}
        </section>
      )}
      {tab === "Activity" && (
        <>
          <div className="notice">
            Last site-access / attendance activity:{" "}
            {e.lastActivity ? displayDate(e.lastActivity) : "Not available"}.
          </div>
          <section className="surface">
            <div className="section-head">
              <h2>Change history</h2>
            </div>
            {state.events.filter((ev) => ev.subjectId === id).length ? (
              <div className="timeline">
                {state.events
                  .filter((ev) => ev.subjectId === id)
                  .reverse()
                  .map((ev) => (
                    <div className="timeline-row" key={ev.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{ev.action}</strong>
                        <p>{ev.note}</p>
                        <small>
                          {ev.actor} · {displayDate(ev.timestamp)}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <Empty
                title="No changes yet"
                text="Changes to this record will appear here with who made them and when."
              />
            )}
          </section>
        </>
      )}
      {dialog === "hire" && (
        <HireEditDialog employee={e} onClose={() => setDialog(null)} />
      )}
      {dialog === "exit" && (
        <ExitDialog employee={e} onClose={() => setDialog(null)} />
      )}
      {dialog === "bank" && (
        <BankDialog employee={e} onClose={() => setDialog(null)} />
      )}
      {dialog === "correct" && (
        <CorrectionDialog employee={e} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
