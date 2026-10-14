"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PaperPlaneTiltIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import { Employee, banks, departments } from "@/lib/domain/model";
import { PageHeading } from "@/components/ui/primitives";
export default function NewHire() {
  const { state, actor, act, today } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: "",
    department: "Maintenance",
    job: "",
    bank: "Zenith Bank",
    account: "",
    taxId: "",
    startDate: today,
    manager: "",
    requisition: "",
    salary: "450000",
  });
  const field = (key: keyof typeof draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const submit = (submitted: boolean) => {
    const max = Math.max(
      0,
      ...state.employees.map((e) => Number(e.id.replace("EMP-", ""))),
    );
    const employee: Employee = {
      ...draft,
      id: `EMP-${String(max + 1).padStart(3, "0")}`,
      salary: Number(draft.salary),
      employment: "Employed",
      eligible: false,
      approval: "Draft",
      createdBy: actor.id,
      approverId: null,
      lastActivity: null,
    };
    if (act({ type: "saveHire", employee, submit: submitted }))
      router.push(`/employees/${employee.id}`);
  };
  return (
    <>
      <Link href="/employees" className="back-link">
        <ArrowLeftIcon size={14} />
        Employee register
      </Link>
      <PageHeading
        eyebrow="ONBOARDING"
        title="Create a new hire"
        description="Capture the employee details and submit for independent HR approval."
      />
      {actor.role !== "HR Officer" && (
        <div className="notice amber">
          Only an HR Officer can create a hire.
        </div>
      )}
      <div className="form-layout">
        <form
          className="surface"
          onSubmit={(e) => {
            e.preventDefault();
            submit(true);
          }}
        >
          <section className="form-section">
            <h2>Employee information</h2>
            <p>All fields are required.</p>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  value={draft.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="e.g. Emeka Nwosu"
                />
              </label>
              <label>
                Department
                <select
                  value={draft.department}
                  onChange={(e) => field("department", e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Job role
                <input
                  required
                  value={draft.job}
                  onChange={(e) => field("job", e.target.value)}
                  placeholder="e.g. Maintenance Technician"
                />
              </label>
              <label>
                Reporting manager
                <input
                  required
                  value={draft.manager}
                  onChange={(e) => field("manager", e.target.value)}
                  placeholder="Manager’s full name"
                />
              </label>
              <label>
                Start date
                <input
                  required
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => field("startDate", e.target.value)}
                />
              </label>
              <label>
                Approved headcount requisition
                <select
                  required
                  value={draft.requisition}
                  onChange={(e) => field("requisition", e.target.value)}
                >
                  <option value="">Select approved requisition</option>
                  {["HC-2026-091", "HC-2026-092", "HC-2026-093"].map((r) => (
                    <option key={r}>{r} · Approved</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="form-section">
            <h2>Payroll & bank details</h2>
            <p>Salary payments are made to this account.</p>
            <div className="form-grid">
              <label>
                Bank name
                <select
                  value={draft.bank}
                  onChange={(e) => field("bank", e.target.value)}
                >
                  {banks.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label>
                Account number
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={draft.account}
                  onChange={(e) => field("account", e.target.value)}
                  placeholder="10-digit account number"
                />
              </label>
              <label>
                Tax ID
                <input
                  required
                  value={draft.taxId}
                  onChange={(e) => field("taxId", e.target.value)}
                  placeholder="e.g. TIN-1001"
                />
              </label>
              <label>
                Monthly salary (NGN)
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={draft.salary}
                  onChange={(e) => field("salary", e.target.value)}
                />
              </label>
            </div>
          </section>
          <div className="form-actions">
            <Link className="button secondary" href="/employees">
              Cancel
            </Link>
            <button
              type="button"
              disabled={actor.role !== "HR Officer"}
              className="button secondary"
              onClick={() => submit(false)}
            >
              Save draft
            </button>
            <button disabled={actor.role !== "HR Officer"} className="button">
              <PaperPlaneTiltIcon size={14} />
              Submit for approval
            </button>
          </div>
        </form>
        <aside className="surface aside-card">
          <ShieldCheckIcon size={24} className="text-primary" />
          <h3>Independent approval</h3>
          <p>
            A new hire becomes payroll-eligible only after review by the second
            HR approver.
          </p>
          <ol>
            <li>HR officer submits the record</li>
            <li>Second HR actor reviews</li>
            <li>Approved hire enters payroll</li>
          </ol>
          <p className="mt-4">
            An employee ID is assigned when you save. Drafts and returned hires
            are excluded from payroll.
          </p>
        </aside>
      </div>
    </>
  );
}
