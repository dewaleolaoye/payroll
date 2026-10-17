"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ArrowUUpLeftIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import { Badge, Empty, Modal, PageHeading } from "@/components/ui/primitives";
import {
  actorName,
  currency,
  displayDate,
  displayDateTime,
} from "@/lib/domain/model";
import type { Action } from "@/lib/domain/workflow";
type Tab = "Hires" | "Exits";
interface Item {
  key: string;
  employeeId: string;
  name: string;
  lines: string[];
  subtitle: string;
  fields: [string, string][];
  approve: Action;
  reject: (reason: string) => Action;
}
export default function Approvals() {
  const { state, actor, act } = useApp();
  const [tab, setTab] = useState<Tab>("Hires");
  const [selected, setSelected] = useState("");
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");
  const hires: Item[] = state.employees
    .filter((e) => e.approval === "Pending")
    .map((e) => ({
      key: e.id,
      employeeId: e.id,
      name: e.name,
      lines: [`${e.id} · ${e.department}`, e.job],
      subtitle: `${e.id} · Submitted by ${actorName(e.createdBy)}`,
      fields: [
        ["Department", e.department],
        ["Job role", e.job],
        ["Offer letter signed", displayDate(e.offerSignedDate)],
        ["Start date", displayDate(e.startDate)],
        ["Submitted", displayDateTime(e.submittedAt)],
        ["Manager", e.manager],
        ["Approved requisition", e.requisition],
        ["Salary", currency(e.salary)],
        ["Bank", e.bank],
        ["Account", e.account],
        ["Tax ID", e.taxId],
      ],
      approve: { type: "approve", id: e.id },
      reject: (reason) => ({ type: "return", id: e.id, reason }),
    }));
  const exits: Item[] = state.exits
    .filter((x) => x.status === "Pending")
    .map((x) => {
      const e = state.employees.find((e) => e.id === x.employeeId);
      return {
        key: x.id,
        employeeId: x.employeeId,
        name: e?.name ?? x.employeeId,
        lines: [`${x.employeeId} · ${e?.department ?? ""}`, x.id],
        subtitle: `${x.id} · Recorded by ${x.processedBy}`,
        fields: [
          ["Department", e?.department ?? "—"],
          ["Job role", e?.job ?? "—"],
          ["Contract termination date", displayDate(x.lastWorkingDate)],
          ["Recorded", displayDateTime(x.recordedAt)],
          ["Exit reason", x.reason],
          ["Monthly salary", e ? currency(e.salary) : "—"],
        ],
        approve: { type: "approveExit", exitId: x.id },
        reject: (reason) => ({ type: "returnExit", exitId: x.id, reason }),
      };
    });
  const items = tab === "Hires" ? hires : exits;
  const item = items.find((i) => i.key === selected) ?? items[0];
  const noun = tab === "Hires" ? "hire" : "exit";
  const isApprover = actor.role === "HR Approver";
  return (
    <>
      <PageHeading
        title="Approvals"
        description="Independently review hires and exits recorded by HR."
      />
      <div className="tabs" style={{ marginTop: 0 }}>
        {(["Hires", "Exits"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setSelected("");
            }}
          >
            {t} ({(t === "Hires" ? hires : exits).length})
          </button>
        ))}
      </div>
      <div className="notice">
        {isApprover
          ? tab === "Hires"
            ? "You are reviewing as the second HR approver. Approval activates payroll eligibility."
            : "You are reviewing as the second HR approver. Approval ends the employment and deactivates payroll eligibility."
          : `Only an HR Approver can approve or return ${tab === "Hires" ? "a hire" : "an exit"}.`}
      </div>
      {!item ? (
        <section className="surface">
          <Empty
            title="All caught up"
            text={
              tab === "Hires"
                ? "There are no pending hires. Hires submitted by HR will appear here for independent approval."
                : "There are no pending exits. Exits recorded by HR will appear here for independent approval."
            }
            href={tab === "Hires" ? "/employees/new" : "/exits"}
            action={tab === "Hires" ? "Create a hire" : "Go to exits"}
          />
        </section>
      ) : (
        <div className="approval-layout">
          <section className="surface approval-queue">
            <div className="section-head">
              <h2>Pending review</h2>
              <Badge tone="amber">{items.length}</Badge>
            </div>
            {items.map((i) => (
              <button
                key={i.key}
                className={`approval-item ${item.key === i.key ? "active" : ""}`}
                onClick={() => setSelected(i.key)}
              >
                <strong>{i.name}</strong>
                {i.lines.map((line) => (
                  <small key={line}>{line}</small>
                ))}
                <Badge tone="amber">Pending approval</Badge>
              </button>
            ))}
          </section>
          <section className="surface">
            <div className="section-head">
              <div>
                <h2>{item.name}</h2>
                <p>{item.subtitle}</p>
              </div>
              <Link
                href={`/employees/${item.employeeId}`}
                className="text-link"
              >
                Employee record
                <ArrowUpRightIcon size={14} />
              </Link>
            </div>
            <div className="detail-grid">
              {item.fields.map(([label, value]) => (
                <div className="detail-field" key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="form-section">
              <h2>Approval outcome</h2>
              <p className="!mb-0">
                {tab === "Hires"
                  ? "Confirm the requisition and employee details. Approval makes the hire active for the next eligible payroll period."
                  : "Confirm the termination details. Approval marks the employee as exited and removes them from future payroll runs."}
              </p>
            </div>
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={!isApprover}
                onClick={() => setReturning(true)}
              >
                <ArrowUUpLeftIcon size={14} />
                Return for correction
              </button>
              <button
                className="button"
                disabled={!isApprover}
                onClick={() => act(item.approve)}
              >
                <CheckIcon size={14} />
                Approve {noun}
              </button>
            </div>
          </section>
        </div>
      )}
      {returning && item && (
        <Modal
          title={`Return ${noun} for correction`}
          description={item.name}
          onClose={() => setReturning(false)}
        >
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (act(item.reject(reason))) {
                setReturning(false);
                setReason("");
              }
            }}
          >
            <div className="modal-body">
              <label>
                Reason
                <textarea
                  required
                  value={reason}
                  onChange={(ev) => setReason(ev.target.value)}
                  placeholder="What needs to be corrected?"
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setReturning(false)}
              >
                Cancel
              </button>
              <button className="button">Return {noun}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
