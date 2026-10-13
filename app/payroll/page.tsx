"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  PlayIcon,
  CalendarDotsIcon,
  DownloadSimpleIcon,
  ArrowUpRightIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import {
  Badge,
  Empty,
  EmployeeName,
  Modal,
  PageHeading,
} from "@/components/ui/primitives";
import {
  currency,
  displayDate,
  displayPeriod,
  period,
} from "@/lib/domain/model";
import { eligibleEmployees } from "@/lib/domain/workflow";
export default function Payroll() {
  const { state, actor, act, exportData } = useSimulation();
  const router = useRouter();
  const [tab, setTab] = useState("Included");
  const [confirm, setConfirm] = useState(false);
  const [advance, setAdvance] = useState(false);
  const eligible = eligibleEmployees(state);
  const excluded = state.employees.filter(
    (e) => !eligible.some((p) => p.id === e.id),
  );
  const total = eligible.reduce((sum, e) => sum + e.salary, 0);
  const run = state.runs.find((r) => r.period === period(state.date));
  const rows = tab === "Included" ? eligible : excluded;
  return (
    <>
      <PageHeading
        eyebrow="MONTHLY PAYROLL"
        title="Payroll runs"
        description="Preview the population, process simulated payments, and retain the source evidence."
      >
        <button className="button secondary" onClick={exportData}>
          <DownloadSimpleIcon size={14} />
          Export data
        </button>
        <button className="button secondary" onClick={() => setAdvance(true)}>
          <CalendarDotsIcon size={14} />
          Next period
        </button>
      </PageHeading>
      <section className="surface">
        <div className="section-head">
          <div>
            <h2>{displayPeriod(state.date)}</h2>
            <p>
              Payments dated {displayDate(state.date)} · based on source payroll
              eligibility
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
              {run ? "Current source estimate" : "Estimated payment total"}
            </small>
            <strong>{currency(total)}</strong>
          </div>
        </div>
      </section>
      {run ? (
        <div className="notice section-gap">
          <WalletIcon size={16} />
          <div className="flex-1">
            This period has already been processed. Historical payment values
            are preserved independently of current source records.
          </div>
          <Link href={`/payroll/${run.id}`} className="text-link">
            View processed run
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="notice section-gap">
          Only approved, payroll-eligible employees whose start date has been
          reached are included. Payroll uses eligibility as recorded by HR.
        </div>
      )}
      <section className="surface">
        <div className="section-head">
          <h2>Payroll preview</h2>
          <span className="count-note">Current source records</span>
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
              {rows.map((e) => (
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
                          : e.startDate > state.date
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
        {!run && (
          <div className="form-actions">
            <span className="count-note mr-auto self-center">
              No funds are transferred.
            </span>
            <button
              className="button"
              disabled={actor.role !== "Payroll Processor" || !eligible.length}
              onClick={() => setConfirm(true)}
            >
              <PlayIcon size={14} />
              Process simulated payroll
            </button>
          </div>
        )}
      </section>
      {actor.role !== "Payroll Processor" && !run && (
        <p className="count-note mt-3">
          Sign in as Tunde Bakare · Payroll Processor to process this period.
        </p>
      )}
      <section className="surface section-gap">
        <div className="section-head">
          <h2>Run history</h2>
          <span className="count-note">{state.runs.length} completed runs</span>
        </div>
        {state.runs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Period</th>
                  <th>Employees paid</th>
                  <th>Total simulated payments</th>
                  <th>Processed by</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...state.runs].reverse().map((r) => (
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
                        className="text-link"
                        href={`/payroll/${r.id}`}
                        aria-label={`Open ${r.id}`}
                      >
                        <ArrowUpRightIcon size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No payroll runs yet"
            text="Process the current period to create your first simulated payroll run."
          />
        )}
      </section>
      {confirm && (
        <Modal
          title="Process simulated payroll?"
          description={`${displayPeriod(state.date)} · ${eligible.length} employees · ${currency(total)}`}
          onClose={() => setConfirm(false)}
        >
          <div className="modal-body">
            <div className="notice" style={{ margin: 0 }}>
              This creates a permanent snapshot of payment rows for this
              simulation period. It does not send money, post to a ledger, or
              connect to a bank.
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
                  router.push(
                    `/payroll/RUN-${period(state.date).replace("-", "")}`,
                  );
                }
              }}
            >
              Process payroll
            </button>
          </div>
        </Modal>
      )}
      {advance && (
        <Modal
          title="Advance simulation period?"
          description="The simulation clock will move to the first day of the next month. Existing source records and payroll history are retained."
          onClose={() => setAdvance(false)}
        >
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setAdvance(false)}
            >
              Cancel
            </button>
            <button
              className="button"
              onClick={() => {
                if (act({ type: "advancePeriod" })) setAdvance(false);
              }}
            >
              Advance period
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
