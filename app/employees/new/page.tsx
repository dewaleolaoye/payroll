"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ShieldCheck, Copy } from "lucide-react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import { Employee, banks, departments } from "@/lib/domain/model";
import { PageHeading } from "@/components/ui/primitives";
export default function NewHire() {
  const { state, actor, act } = useSimulation();
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: "",
    department: "Maintenance",
    job: "",
    bank: "Zenith Bank",
    account: "",
    taxId: "",
    startDate: state.date,
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
  const fillShared = () => {
    const e = state.employees.find(
      (e) => e.approval === "Approved" && e.eligible,
    );
    if (e)
      setDraft({
        name: "Daniel Okoro",
        department: "Maintenance",
        job: "Contract Technician",
        bank: e.bank,
        account: e.account,
        taxId: "TIN-DEMO-9001",
        startDate: state.date,
        manager: "Michael Brown",
        requisition: "HC-2026-091",
        salary: "480000",
      });
  };
  return (
    <>
      <Link href="/employees" className="back-link">
        <ArrowLeft size={14} />
        Employee register
      </Link>
      <PageHeading
        eyebrow="ONBOARDING"
        title="Create a new hire"
        description="Capture the employee details and submit for independent HR approval."
      />
      {actor.role !== "HR Officer" && (
        <div className="notice amber">
          Switch to HR Officer using the actor menu to create a hire.
        </div>
      )}
      {state.scenario === "Shared account" && (
        <div className="notice amber">
          <div className="flex-1">
            Shared-account walkthrough: use an existing employee’s account to
            recreate the source-system deviation.
          </div>
          <button className="text-link" onClick={fillShared}>
            <Copy size={14} />
            Fill demo example
          </button>
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
            <p>All fields are required. Use synthetic details only.</p>
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
            <p>
              Demo bank details are stored as source data, with no connection to
              banking services.
            </p>
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
                  placeholder="10-digit synthetic account"
                />
              </label>
              <label>
                Tax ID
                <input
                  required
                  value={draft.taxId}
                  onChange={(e) => field("taxId", e.target.value)}
                  placeholder="e.g. TIN-DEMO-1001"
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
              <Send size={14} />
              Submit for approval
            </button>
          </div>
        </form>
        <aside className="surface aside-card">
          <ShieldCheck size={24} className="text-primary" />
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
