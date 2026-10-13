"use client";
import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpRightIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import {
  Badge,
  Empty,
  EmployeeName,
  PageHeading,
} from "@/components/ui/primitives";
import { departments } from "@/lib/domain/model";
export default function Employees() {
  const { state, exportData } = useSimulation();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const rows = state.employees.filter(
    (e) =>
      `${e.name} ${e.id} ${e.job}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!department || e.department === department) &&
      (!status ||
        (status === "Eligible"
          ? e.eligible
          : status === "Inactive"
            ? !e.eligible
            : status === e.employment || status === e.approval)),
  );
  return (
    <>
      <PageHeading
        eyebrow="WORKFORCE"
        title="Employees"
        description="Manage employee records from onboarding through their final payroll."
      >
        <button className="button secondary" onClick={exportData}>
          <DownloadSimpleIcon size={15} />
          Export source data
        </button>
        <Link href="/employees/new" className="button">
          <PlusIcon size={15} />
          New hire
        </Link>
      </PageHeading>
      <section className="surface">
        <div className="toolbar">
          <div className="search">
            <MagnifyingGlassIcon size={15} />
            <input
              aria-label="Search employees"
              placeholder="Search by name, employee ID, or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {[
              "Employed",
              "Exited",
              "Pending",
              "Draft",
              "Returned",
              "Eligible",
              "Inactive",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department / role</th>
                <th>Approval</th>
                <th>HR status</th>
                <th>Payroll eligibility</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <EmployeeName name={e.name} id={e.id} />
                  </td>
                  <td>
                    {e.department}
                    <span className="block text-[10px] text-muted mt-1">
                      {e.job}
                    </span>
                  </td>
                  <td>
                    <Badge
                      tone={
                        e.approval === "Approved"
                          ? "green"
                          : e.approval === "Pending"
                            ? "amber"
                            : "neutral"
                      }
                    >
                      {e.approval}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={e.employment === "Employed" ? "green" : "neutral"}
                    >
                      {e.employment}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={e.eligible ? "green" : "neutral"}>
                      {e.eligible ? "Eligible" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      href={`/employees/${e.id}`}
                      aria-label={`Open ${e.name}`}
                      className="text-link"
                    >
                      <ArrowUpRightIcon size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="No matching employees"
            text="Try a different search or clear the filters."
          />
        )}
        <div className="table-foot">
          Showing {rows.length} of {state.employees.length} employees · All
          records are synthetic
        </div>
      </section>
    </>
  );
}
