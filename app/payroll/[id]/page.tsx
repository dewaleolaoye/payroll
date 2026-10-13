"use client";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import {
  Badge,
  Empty,
  EmployeeName,
  PageHeading,
} from "@/components/ui/primitives";
import { currency, displayDate, displayPeriod } from "@/lib/domain/model";
export default function RunDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state, exportData } = useSimulation();
  const run = state.runs.find((r) => r.id === id);
  if (!run)
    return (
      <Empty
        title="Payroll run not found"
        text="This run may belong to an earlier simulation. Open payroll to view current records."
        href="/payroll"
        action="View payroll"
      />
    );
  return (
    <>
      <Link href="/payroll" className="back-link">
        <ArrowLeftIcon size={14} />
        Payroll runs
      </Link>
      <PageHeading
        eyebrow="PAYROLL SOURCE RECORD"
        title={displayPeriod(run.period)}
        description={`${run.id} · Processed by ${run.processedBy} on ${displayDate(run.date)}`}
      >
        <button className="button secondary" onClick={exportData}>
          <DownloadSimpleIcon size={14} />
          Export source data
        </button>
      </PageHeading>
      <div className="notice">
        This run is complete. The salary and bank details below are snapshots
        from processing time; source corrections affect future runs.
      </div>
      <section className="surface">
        <div className="summary-band">
          <div>
            <small>Employees paid</small>
            <strong>{run.payments.length}</strong>
          </div>
          <div>
            <small>Total simulated payments</small>
            <strong>
              {currency(run.payments.reduce((sum, p) => sum + p.amount, 0))}
            </strong>
          </div>
          <div>
            <small>Payment status</small>
            <Badge tone="green">Simulated paid</Badge>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Amount paid</th>
                <th>Bank / account used</th>
                <th>Payment date</th>
                <th>Payment reference</th>
              </tr>
            </thead>
            <tbody>
              {run.payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <EmployeeName name={p.employeeName} id={p.employeeId} />
                  </td>
                  <td>{currency(p.amount)}</td>
                  <td>
                    {p.bank}
                    <span className="block mono text-muted mt-1">
                      {p.account}
                    </span>
                  </td>
                  <td>{displayDate(p.paymentDate)}</td>
                  <td className="mono">{p.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          {run.excludedIds.length} excluded employees at processing time
          {run.excludedIds.length > 0 && (
            <span>
              {" "}
              ·{" "}
              {run.excludedIds.map((id, i) => (
                <span key={id}>
                  {i > 0 ? ", " : ""}
                  <Link className="text-primary" href={`/employees/${id}`}>
                    {id}
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      </section>
    </>
  );
}
