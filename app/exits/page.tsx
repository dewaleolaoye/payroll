"use client";
import { useState } from "react";
import { SignOutIcon } from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import {
  Badge,
  Empty,
  EmployeeName,
  Modal,
  PageHeading,
  Pagination,
  usePagination,
} from "@/components/ui/primitives";
import { displayDate, displayDateTime } from "@/lib/domain/model";
import { ExitDialog } from "@/features/workforce/RecordDialogs";
export default function Exits() {
  const { state, actor } = useApp();
  const [choose, setChoose] = useState(false);
  const [selected, setSelected] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const candidates = state.employees.filter(
    (e) =>
      e.employment === "Employed" &&
      e.approval === "Approved" &&
      !state.exits.some((x) => x.employeeId === e.id && x.status === "Pending"),
  );
  const e = state.employees.find((e) => e.id === employeeId);
  const pager = usePagination(state.exits);
  const canEdit =
    actor.role === "HR Officer" || actor.role === "HR/Payroll Lead";
  return (
    <>
      <PageHeading
        eyebrow="OFFBOARDING"
        title="Employee exits"
        description="Record assignment endings and manage the transition out of payroll."
      >
        <button
          className="button"
          disabled={!canEdit || !candidates.length}
          onClick={() => {
            setSelected(candidates[0]?.id ?? "");
            setChoose(true);
          }}
        >
          <SignOutIcon size={14} />
          Record exit
        </button>
      </PageHeading>
      {!canEdit && (
        <div className="notice amber">
          Only an HR Officer or HR/Payroll Lead can process exits.
        </div>
      )}
      <section className="surface">
        <div className="section-head">
          <div>
            <h2>Exit register</h2>
            <p>
              Original processing details remain available after corrections
            </p>
          </div>
          <span className="count-note">{state.exits.length} records</span>
        </div>
        {state.exits.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Termination date</th>
                    <th>Reason</th>
                    <th>Recorded by</th>
                    <th>Status</th>
                    <th>Current payroll</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageRows.map((x) => {
                    const employee = state.employees.find(
                      (e) => e.id === x.employeeId,
                    );
                    return (
                      <tr key={x.id}>
                        <td>
                          <EmployeeName
                            name={employee?.name ?? x.employeeId}
                            id={x.employeeId}
                          />
                        </td>
                        <td>
                          {displayDate(x.lastWorkingDate)}
                          <small className="block text-muted mt-1">
                            {x.id}
                          </small>
                        </td>
                        <td>{x.reason}</td>
                        <td>
                          {x.processedBy}
                          <small className="block text-muted mt-1">
                            {displayDateTime(x.recordedAt)}
                          </small>
                        </td>
                        <td>
                          <Badge
                            tone={
                              x.status === "Approved"
                                ? "green"
                                : x.status === "Pending"
                                  ? "amber"
                                  : "neutral"
                            }
                          >
                            {x.status === "Pending"
                              ? "Pending approval"
                              : x.status}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            tone={employee?.eligible ? "amber" : "neutral"}
                          >
                            {employee?.eligible ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pager} noun="exits" />
          </>
        ) : (
          <Empty
            title="No exits recorded"
            text="Record an employee’s exit to show how payroll eligibility changes."
          />
        )}
      </section>
      {choose && (
        <Modal
          title="Select employee"
          description="Choose an approved employee whose assignment has ended."
          onClose={() => setChoose(false)}
        >
          <div className="modal-body">
            <label>
              Employee
              <select
                value={selected}
                onChange={(ev) => setSelected(ev.target.value)}
              >
                {candidates.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {e.id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setChoose(false)}
            >
              Cancel
            </button>
            <button
              className="button"
              onClick={() => {
                setEmployeeId(selected);
                setChoose(false);
              }}
            >
              Continue
            </button>
          </div>
        </Modal>
      )}
      {e && <ExitDialog employee={e} onClose={() => setEmployeeId("")} />}
    </>
  );
}
