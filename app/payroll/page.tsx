"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  PlayIcon,
  CalendarDotsIcon,
  WalletIcon,
} from "@phosphor-icons/react";
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
import {
  currency,
  displayDate,
  displayPeriod,
  nextMonth,
} from "@/lib/domain/model";
import { eligibleEmployees } from "@/lib/domain/workflow";
export default function Payroll() {
  const { state, actor, act, today } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState("Included");
  const [confirm, setConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const eligible = eligibleEmployees(state, today);
  const excluded = state.employees.filter(
    (e) => !eligible.some((p) => p.id === e.id),
  );
  const total = eligible.reduce((sum, e) => sum + e.salary, 0);
  const run = state.runs.find((r) => r.period === state.period);
  const rows = tab === "Included" ? eligible : excluded;
  const preview = usePagination(rows, tab);
  const history = usePagination([...state.runs].reverse());
  const nextPeriod = displayPeriod(nextMonth(state.period + "-01"));
  const isLead = actor.role === "HR/Payroll Lead";
  // Closing a period opens the next month early; it can't be processed until that month starts.
  const opensOn = state.period + "-01";
  const notStarted = state.period > today.slice(0, 7);
  return (
    <>
      <PageHeading
        eyebrow="MONTHLY PAYROLL"
        title="Payroll runs"
        description="Preview who will be paid, process the period, and keep a record of every run."
      >
        {isLead && (
          <button
            className="button secondary"
            disabled={!run}
            title={
              run ? undefined : "Process payroll before closing the period"
            }
            onClick={() => setClosing(true)}
          >
            <CalendarDotsIcon size={14} />
            Close period
          </button>
        )}
      </PageHeading>
      <section className="surface">
        <div className="section-head">
          <div>
            <h2>{displayPeriod(state.period)}</h2>
            <p>
              {notStarted
                ? `Opens for processing on ${displayDate(opensOn)}`
                : `Payments dated ${displayDate(run ? run.date : today)}`}{" "}
              · based on payroll eligibility
            </p>
          </div>
          <Badge tone={run ? "green" : "amber"}>
            {run ? "Processed" : "Preview"}
          </Badge>
        </div>
        <div className="summary-band">
          <div>
            <small>Included employees</small>
            <strong>{eligible.length}</strong>
          </div>
          <div>
            <small>Excluded employees</small>
            <strong>{excluded.length}</strong>
          </div>
          <div>
            <small>
              {run ? "Current estimate" : "Estimated payment total"}
            </small>
            <strong>{currency(total)}</strong>
          </div>
        </div>
      </section>
      {run ? (
        <div className="notice section-gap">
          <WalletIcon size={16} />
          <div className="flex-1">
            This period has been processed. A payroll lead can close it to open{" "}
            {nextPeriod}. Payment values are kept as processed.
          </div>
          <Link href={`/payroll/${run.id}`} className="text-link">
            View processed run
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="notice section-gap">
          {notStarted
            ? `${displayPeriod(state.period)} is open but can’t be processed until ${displayDate(opensOn)}. The preview below uses current employee records.`
            : "Only approved, payroll-eligible employees whose start date has been reached are included. Payroll uses eligibility as recorded by HR."}
        </div>
      )}
      <section className="surface">
        <div className="section-head">
          <h2>Payroll preview</h2>
          <span className="count-note">Current employee records</span>
        </div>
        <div className="tabs" style={{ margin: "18px 22px 0" }}>
          <button
            className={tab === "Included" ? "active" : ""}
            onClick={() => setTab("Included")}
          >
            Included ({eligible.length})
          </button>
          <button
            className={tab === "Excluded" ? "active" : ""}
            onClick={() => setTab("Excluded")}
          >
            Excluded ({excluded.length})
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Bank / account</th>
                <th>Monthly amount</th>
                <th>
                  {tab === "Included" ? "Payroll status" : "Exclusion reason"}
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.pageRows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <EmployeeName name={e.name} id={e.id} />
                  </td>
                  <td>{e.department}</td>
                  <td>
                    {e.bank}
                    <span className="block mono text-muted mt-1">
                      {e.account}
                    </span>
                  </td>
                  <td>{currency(e.salary)}</td>
                  <td>
                    {tab === "Included" ? (
                      <Badge tone="green">Eligible</Badge>
                    ) : (
                      <Badge>
                        {e.approval !== "Approved"
                          ? `Hire ${e.approval.toLowerCase()}`
                          : e.startDate > today
                            ? "Future start date"
                            : "Inactive eligibility"}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title={
              tab === "Included" ? "No eligible employees" : "No exclusions"
            }
            text={
              tab === "Included"
                ? "Approve hires or review employee eligibility."
                : "All current employees meet the payroll inclusion criteria."
            }
          />
        )}
        <Pagination {...preview} noun="employees" />
        {!run && (
          <div className="form-actions">
            <span className="count-note mr-auto self-center">
              {notStarted
                ? `Processing opens on ${displayDate(opensOn)}.`
                : `Payments will be dated ${displayDate(today)}.`}
            </span>
            <button
              className="button"
              disabled={
                actor.role !== "Payroll Processor" ||
                !eligible.length ||
                notStarted
              }
              onClick={() => setConfirm(true)}
            >
              <PlayIcon size={14} />
              Process payroll
            </button>
          </div>
        )}
      </section>
      {actor.role !== "Payroll Processor" && !run && (
        <p className="count-note mt-3">
          Only a Payroll Processor can process this period.
        </p>
      )}
      <section className="surface section-gap">
        <div className="section-head">
          <h2>Run history</h2>
          <span className="count-note">{state.runs.length} completed runs</span>
        </div>
        {state.runs.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Period</th>
                    <th>Employees paid</th>
                    <th>Total payments</th>
                    <th>Processed by</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {history.pageRows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td>{displayPeriod(r.period)}</td>
                      <td>{r.payments.length}</td>
                      <td>
                        {currency(
                          r.payments.reduce((sum, p) => sum + p.amount, 0),
                        )}
                      </td>
                      <td>{r.processedBy}</td>
                      <td>
                        <Link
                          className="button secondary small"
                          href={`/payroll/${r.id}`}
                          aria-label={`Open ${r.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...history} noun="runs" />
          </>
        ) : (
          <Empty
            title="No payroll runs yet"
            text="Process the current period to create your first payroll run."
          />
        )}
      </section>
      {confirm && (
        <Modal
          title="Process payroll?"
          description={`${displayPeriod(state.period)} · ${eligible.length} employees · ${currency(total)}`}
          onClose={() => setConfirm(false)}
        >
          <div className="modal-body">
            <div className="notice" style={{ margin: 0 }}>
              This creates a permanent record of payment rows for{" "}
              {displayPeriod(state.period)}, dated {displayDate(today)}. It
              can’t be processed again for this period.
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="button"
              onClick={() => {
                if (act({ type: "processPayroll" })) {
                  setConfirm(false);
                  router.push(`/payroll/RUN-${state.period.replace("-", "")}`);
                }
              }}
            >
              Process payroll
            </button>
          </div>
        </Modal>
      )}
      {closing && (
        <Modal
          title={`Close ${displayPeriod(state.period)}?`}
          description={`This closes the period and opens ${nextPeriod} for payroll. Processed runs and employee records are kept.`}
          onClose={() => setClosing(false)}
        >
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setClosing(false)}
            >
              Cancel
            </button>
            <button
              className="button"
              onClick={() => {
                if (act({ type: "closePeriod" })) setClosing(false);
              }}
            >
              Close period
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
