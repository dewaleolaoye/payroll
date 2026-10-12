"use client";
import { useCallback, useState } from "react";
import { Employee, banks, currency } from "@/lib/domain/model";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import { Modal } from "@/components/ui/primitives";
export function ExitDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { state, act } = useSimulation();
  const [date, setDate] = useState(() => {
    if (state.scenario !== "Ghost worker") return state.date;
    const previous = new Date(state.date + "T12:00:00Z");
    previous.setUTCDate(previous.getUTCDate() - 1);
    return previous.toISOString().slice(0, 10) < employee.startDate
      ? employee.startDate
      : previous.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState("Contract assignment completed");
  const delayed = state.scenario === "Ghost worker";
  const close = useCallback(onClose, [onClose]);
  return (
    <Modal
      title="Record employee exit"
      description={`${employee.name} · ${employee.id}`}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            act({
              type: "exit",
              id: employee.id,
              lastWorkingDate: date,
              reason,
              delayed,
            })
          )
            onClose();
        }}
      >
        <div className="modal-body">
          <label>
            Last working date
            <input
              required
              type="date"
              min={employee.startDate}
              max={state.date}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Exit reason
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div
            className={`notice ${delayed ? "amber" : ""}`}
            style={{ marginBottom: 0 }}
          >
            {delayed
              ? "Ghost-worker scenario is active: this exit will be recorded in HR while payroll eligibility remains Active, simulating delayed synchronization."
              : "Recording the exit will deactivate payroll eligibility. The employee will be excluded from the next payroll run."}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button">Record exit</button>
        </div>
      </form>
    </Modal>
  );
}
export function BankDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { act } = useSimulation();
  const [bank, setBank] = useState(employee.bank);
  const [account, setAccount] = useState(employee.account);
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Update bank details"
      description="Changes apply to future payroll runs. Historical payments retain their original account."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            act({ type: "correctBank", id: employee.id, bank, account, reason })
          )
            onClose();
        }}
      >
        <div className="modal-body">
          <label>
            Bank name
            <select value={bank} onChange={(e) => setBank(e.target.value)}>
              {banks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Account number
            <input
              required
              pattern="[0-9]{10}"
              inputMode="numeric"
              maxLength={10}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </label>
          <label>
            Reason for change
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Record the business reason for this correction"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button">Save bank details</button>
        </div>
      </form>
    </Modal>
  );
}
export function CorrectionDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { act } = useSimulation();
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Deactivate payroll eligibility"
      description={`${employee.name} will be excluded from future payroll runs. Prior payments will be preserved.`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (act({ type: "correctEligibility", id: employee.id, reason }))
            onClose();
        }}
      >
        <div className="modal-body">
          <label>
            Business correction reason
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Confirmed assignment ended; delayed payroll update corrected"
            />
          </label>
          <div className="notice" style={{ marginBottom: 0 }}>
            Monthly salary: {currency(employee.salary)}. This action changes the
            source employee record only.
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button">Deactivate eligibility</button>
        </div>
      </form>
    </Modal>
  );
}
export function HireEditDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { act } = useSimulation();
  const [values, setValues] = useState({
    name: employee.name,
    job: employee.job,
    manager: employee.manager,
    salary: String(employee.salary),
    requisition: employee.requisition,
    taxId: employee.taxId,
  });
  return (
    <Modal
      title="Correct hire details"
      description="Update this draft or returned hire, then submit it for independent approval."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            act({
              type: "editHire",
              id: employee.id,
              ...values,
              salary: Number(values.salary),
            })
          )
            onClose();
        }}
      >
        <div className="modal-body">
          {(
            [
              "name",
              "job",
              "manager",
              "salary",
              "requisition",
              "taxId",
            ] as const
          ).map((key) => (
            <label key={key}>
              {
                {
                  name: "Full name",
                  job: "Job role",
                  manager: "Reporting manager",
                  salary: "Monthly salary (NGN)",
                  requisition: "Approved requisition",
                  taxId: "Tax ID",
                }[key]
              }
              <input
                required
                type={key === "salary" ? "number" : "text"}
                min={key === "salary" ? "1" : undefined}
                value={values[key]}
                onChange={(e) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: e.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button">Save corrections</button>
        </div>
      </form>
    </Modal>
  );
}
