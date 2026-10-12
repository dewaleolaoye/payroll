"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  LogOut,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  Leaf,
} from "lucide-react";
import { actors, displayDate, displayPeriod } from "@/lib/domain/model";
import { useSimulation } from "@/features/simulation/SimulationProvider";
const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/approvals", label: "Hire approvals", icon: ClipboardCheck },
  { href: "/exits", label: "Exits", icon: LogOut },
  { href: "/payroll", label: "Payroll", icon: Wallet },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, actor, setActor, ready, storageWarning } = useSimulation();
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState(false);
  const title =
    navigation.find((n) =>
      n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
    )?.label ?? "Simulation controls";
  const pending = state.employees.filter(
    (e) => e.approval === "Pending",
  ).length;
  return (
    <div className="app-shell">
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link href="/" className="brand">
          <img src="/nlng-logo.avif" alt="NLNG" />
          <span>
            People & Payroll<small>WORKFORCE MANAGEMENT</small>
          </span>
        </Link>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "active"
                  : ""
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === "/approvals" && pending > 0 && <b>{pending}</b>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="site-note">
            <Leaf size={21} />
            <span>
              Bonny Island<small>Nigeria LNG Limited</small>
            </span>
          </div>
          <Link
            href="/simulation"
            onClick={() => setOpen(false)}
            className={pathname === "/simulation" ? "active" : ""}
          >
            <SlidersHorizontal size={18} />
            Simulation controls
            <ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-footnote">
            NLNG Experience Center · Scenario 09
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="simulation-badge">
              <i />
              Simulation
            </span>
            <span className="top-date">{displayDate(state.date)}</span>
            <div className="role-wrap">
              <button
                className="actor-button"
                aria-expanded={roles}
                onClick={() => setRoles(!roles)}
              >
                <span className="avatar">{actor.initials}</span>
                <span className="actor-copy">
                  <strong>{actor.name}</strong>
                  <small>{actor.role}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {roles && (
                <div className="role-menu">
                  <div className="menu-title">
                    SWITCH DEMO ACTOR
                    <button
                      aria-label="Close role menu"
                      onClick={() => setRoles(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {actors.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setActor(a.id);
                        setRoles(false);
                      }}
                    >
                      <span className="avatar small">{a.initials}</span>
                      <span>
                        <strong>{a.name}</strong>
                        <small>{a.role}</small>
                      </span>
                      {a.id === actor.id && (
                        <span className="role-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="period-strip">
          <span>
            <i />
            {displayPeriod(state.date)} payroll period
          </span>
          <Link href="/simulation">
            {state.scenario}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        {storageWarning && (
          <div className="notice amber">
            Local storage is unavailable. Progress will last only while this
            page stays open. Export your source data before leaving.
          </div>
        )}
        <main>
          {ready ? children : <div className="loading">Loading workforce…</div>}
        </main>
        <footer className="workspace-footer">
          <span>NLNG · People & Payroll</span>
          <span>Synthetic records. No actual payments.</span>
        </footer>
      </div>
    </div>
  );
}
