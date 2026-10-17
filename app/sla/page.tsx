"use client";
import { UserPlusIcon, SignOutIcon } from "@phosphor-icons/react";
import { Badge, PageHeading } from "@/components/ui/primitives";
const agreements = [
  {
    title: "Hiring",
    icon: UserPlusIcon,
    statement:
      "A new hire must be created and approved within 24 hours of the candidate signing the offer letter.",
    steps: [
      {
        title: "Offer letter signed",
        text: "The candidate signs the offer letter. The 24-hour window starts.",
      },
      {
        title: "Create the hire",
        text: "An HR Officer records the employee details and submits them for approval.",
      },
      {
        title: "Independent approval",
        text: "A different HR Approver reviews and approves the hire.",
      },
      {
        title: "Payroll eligible",
        text: "Once approved, the employee is included in the next payroll run.",
      },
    ],
    evidence: [
      ["Clock starts", "Offer letter signed date"],
      ["Hire submitted", "Date and time recorded"],
      ["Hire approved", "Date, time and approver recorded"],
      ["Deadline", "24 hours after offer letter signing"],
    ],
  },
  {
    title: "Exit",
    icon: SignOutIcon,
    statement:
      "An exit must be recorded and approved within 24 hours of the contract termination.",
    steps: [
      {
        title: "Contract terminated",
        text: "The employee's contract ends. The 24-hour window starts.",
      },
      {
        title: "Record the exit",
        text: "An HR Officer or HR/Payroll Lead records the termination date and reason.",
      },
      {
        title: "Independent approval",
        text: "A different HR Approver reviews and approves the exit.",
      },
      {
        title: "Removed from payroll",
        text: "Once approved, payroll eligibility ends. Until then the employee remains on payroll.",
      },
    ],
    evidence: [
      ["Clock starts", "Contract termination date"],
      ["Exit recorded", "Date, time and recorder captured"],
      ["Exit approved", "Date, time and approver recorded"],
      ["Deadline", "24 hours after contract termination"],
    ],
  },
];
export default function Sla() {
  return (
    <>
      <PageHeading
        title="Service level agreements"
        description="Time limits for the hiring and exit processes."
      />
      {agreements.map(
        ({ title, icon: Icon, statement, steps, evidence }, i) => (
          <section className={`surface ${i ? "section-gap" : ""}`} key={title}>
            <div className="section-head">
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-primary" />
                <div>
                  <h2>{title}</h2>
                  <p>{statement}</p>
                </div>
              </div>
              <Badge tone="blue">24 hours</Badge>
            </div>
            <div className="process-steps">
              {steps.map((s, n) => (
                <div className="process-step" key={s.title}>
                  <span className="step-number">{n + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-grid">
              {evidence.map(([label, value]) => (
                <div className="detail-field" key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        ),
      )}
    </>
  );
}
