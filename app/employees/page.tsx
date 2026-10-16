"use client";
import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import {
  Badge,
  Empty,
  EmployeeName,
  PageHeading,
  Pagination,
  usePagination,
} from "@/components/ui/primitives";
import { departments } from "@/lib/domain/model";
export default function Employees() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const rows = state.employees.filter(
    (e) =>
      `${e.name} ${e.id} ${e.job}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!department || e.department === department) &&
      (!status || status === e.employment),
  );
  const pager = usePagination(rows, `${search}|${department}|${status}`);
  return (
    <>
      <PageHeading
        eyebrow="WORKFORCE"
        title="Employees"
        description="Manage employee records from onboarding through their final payroll."
      >
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
            {["Employed", "Exited"].map((s) => (
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
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pager.pageRows.map((e) => (
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
                      tone={e.employment === "Employed" ? "green" : "neutral"}
                    >
                      {e.employment}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      href={`/employees/${e.id}`}
                      aria-label={`Open ${e.name}`}
                      className="button secondary small"
                    >
                      View
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
        <Pagination {...pager} noun="employees" />
      </section>
    </>
  );
}
