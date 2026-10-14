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
import { currency, displayDate } from "@/lib/domain/model";
export default function Approvals() {
  const { state, actor, act } = useApp();
  const pending = state.employees.filter((e) => e.approval === "Pending");
  const [selected, setSelected] = useState("");
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");
  const e = pending.find((e) => e.id === selected) ?? pending[0];
  return (
    <>
      <PageHeading
        eyebrow="INDEPENDENT VERIFICATION"
        title="Hire approvals"
        description="Review submitted hires before they become active in payroll."
      />
      <div className="notice">
        {actor.role === "HR Approver"
          ? "You are reviewing as the second HR approver. Approval activates payroll eligibility."
          : "Only an HR Approver can approve or return a hire."}
      </div>
      {!pending.length ? (
        <section className="surface">
          <Empty
            title="All caught up"
            text="There are no pending hires. Hires submitted by HR will appear here for independent approval."
            href="/employees/new"
            action="Create a hire"
          />
        </section>
      ) : (
        <div className="approval-layout">
          <section className="surface approval-queue">
            <div className="section-head">
              <h2>Pending review</h2>
              <Badge tone="amber">{pending.length}</Badge>
            </div>
            {pending.map((p) => (
              <button
                key={p.id}
                className={`approval-item ${e.id === p.id ? "active" : ""}`}
                onClick={() => setSelected(p.id)}
              >
                <strong>{p.name}</strong>
                <small>
                  {p.id} · {p.department}
                </small>
                <small>{p.job}</small>
                <Badge tone="amber">Pending approval</Badge>
              </button>
            ))}
          </section>
          <section className="surface">
            <div className="section-head">
              <div>
                <h2>{e.name}</h2>
                <p>
                  {e.id} · Submitted by {e.createdBy}
                </p>
              </div>
              <Link href={`/employees/${e.id}`} className="text-link">
                Employee record
                <ArrowUpRightIcon size={14} />
              </Link>
            </div>
            <div className="detail-grid">
              {[
                ["Department", e.department],
                ["Job role", e.job],
                ["Start date", displayDate(e.startDate)],
                ["Manager", e.manager],
                ["Approved requisition", e.requisition],
                ["Salary", currency(e.salary)],
                ["Bank", e.bank],
                ["Account", e.account],
                ["Tax ID", e.taxId],
              ].map(([label, value]) => (
                <div className="detail-field" key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="form-section">
              <h2>Approval outcome</h2>
              <p className="!mb-0">
                Confirm the requisition and employee details. Approval makes the
                hire active for the next eligible payroll period.
              </p>
            </div>
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={actor.role !== "HR Approver"}
                onClick={() => setReturning(true)}
              >
                <ArrowUUpLeftIcon size={14} />
                Return for correction
              </button>
              <button
                className="button"
                disabled={actor.role !== "HR Approver"}
                onClick={() => act({ type: "approve", id: e.id })}
              >
                <CheckIcon size={14} />
                Approve hire
              </button>
            </div>
          </section>
        </div>
      )}
      {returning && e && (
        <Modal
          title="Return hire for correction"
          description={e.name}
          onClose={() => setReturning(false)}
        >
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (act({ type: "return", id: e.id, reason })) {
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
              <button className="button">Return hire</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
