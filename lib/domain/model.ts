export type Role =
  "HR Officer" | "HR Approver" | "Payroll Processor" | "HR/Payroll Lead";
export type Approval = "Draft" | "Pending" | "Approved" | "Returned";
export interface Employee {
  id: string;
  name: string;
  department: string;
  job: string;
  bank: string;
  account: string;
  taxId: string;
  startDate: string;
  manager: string;
  requisition: string;
  salary: number;
  employment: "Employed" | "Exited";
  eligible: boolean;
  approval: Approval;
  createdBy: string;
  approverId: string | null;
  lastActivity: string | null;
}
export interface Exit {
  id: string;
  employeeId: string;
  lastWorkingDate: string;
  reason: string;
  processedDate: string;
  processedBy: string;
}
export interface Payment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  bank: string;
  account: string;
  paymentDate: string;
  status: "Paid";
}
export interface PayrollRun {
  id: string;
  period: string;
  date: string;
  payments: Payment[];
  excludedIds: string[];
  processedBy: string;
}
export interface SourceEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  subjectId: string;
  note: string;
}
export interface State {
  version: 2;
  /** Open payroll period, "YYYY-MM". Closed manually by the HR/Payroll Lead. */
  period: string;
  employees: Employee[];
  exits: Exit[];
  runs: PayrollRun[];
  events: SourceEvent[];
}
export interface Actor {
  id: string;
  name: string;
  role: Role;
  initials: string;
}
export const actors: Actor[] = [
  { id: "HR-001", name: "Chukwudi Okafor", role: "HR Officer", initials: "CO" },
  { id: "HR-002", name: "Amina Yusuf", role: "HR Approver", initials: "AY" },
  {
    id: "PAY-001",
    name: "Tunde Bakare",
    role: "Payroll Processor",
    initials: "TB",
  },
  {
    id: "LEAD-001",
    name: "Ngozi Eze",
    role: "HR/Payroll Lead",
    initials: "NE",
  },
];
export const departments = [
  "Maintenance",
  "Operations",
  "Engineering",
  "Finance",
  "Human Resources",
  "HSE",
];
export const banks = ["Zenith Bank", "Access Bank", "GTBank", "First Bank"];
export function currency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}
export function displayDate(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
/** Today's local calendar date as "YYYY-MM-DD". */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function period(date: string): string {
  return date.slice(0, 7);
}
export function displayPeriod(value: string): string {
  return new Date(value.slice(0, 7) + "-01T12:00:00Z").toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}
export function nextMonth(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}
