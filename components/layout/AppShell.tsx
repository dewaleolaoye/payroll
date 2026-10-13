"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  SquaresFourIcon,
  UsersThreeIcon,
  SealCheckIcon,
  SignOutIcon,
  WalletIcon,
  SlidersHorizontalIcon,
  CaretDownIcon,
  ListIcon,
  XIcon,
  ArrowUpRightIcon,
  LeafIcon,
  IconContext,
} from "@phosphor-icons/react";
import { displayDate, displayPeriod } from "@/lib/domain/model";
import { accountFor } from "@/lib/auth/accounts";
import { useSimulation } from "@/features/simulation/SimulationProvider";
const navigation = [
  { href: "/", label: "Overview", icon: SquaresFourIcon },
  { href: "/employees", label: "Employees", icon: UsersThreeIcon },
  { href: "/approvals", label: "Hire approvals", icon: SealCheckIcon },
  { href: "/exits", label: "Exits", icon: SignOutIcon },
  { href: "/payroll", label: "Payroll", icon: WalletIcon },
];
// Only same-site paths are honoured, so ?next= cannot redirect off the app.
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    next !== "/login"
    ? next
    : "/";
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, actor, ready, storageWarning, signedIn, signOut } =
    useSimulation();
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState(false);
  const isLogin = pathname === "/login";
  useEffect(() => {
    if (!ready) return;
    if (!signedIn && !isLogin)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (signedIn && isLogin) router.replace(nextPath());
  }, [ready, signedIn, isLogin, pathname, router]);
  if (isLogin || !ready || !signedIn)
    return (
      <IconContext.Provider value={{ weight: "duotone" }}>
        {isLogin && ready && !signedIn ? (
          children
        ) : (
          <div className="loading">Loading workforce…</div>
        )}
      </IconContext.Provider>
    );
  const title =
    navigation.find((n) =>
      n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
    )?.label ?? "Simulation controls";
  const pending = state.employees.filter(
    (e) => e.approval === "Pending",
  ).length;
  return (
    <IconContext.Provider value={{ weight: "duotone" }}>
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
              <LeafIcon size={21} />
              <span>
                Bonny Island<small>Nigeria LNG Limited</small>
              </span>
            </div>
            <Link
              href="/simulation"
              onClick={() => setOpen(false)}
              className={pathname === "/simulation" ? "active" : ""}
            >
              <SlidersHorizontalIcon size={18} />
              Simulation controls
              <ArrowUpRightIcon size={14} />
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
                <ListIcon size={20} />
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
                  <CaretDownIcon size={15} />
                </button>
                {roles && (
                  <div className="role-menu">
                    <div className="menu-title">
                      SIGNED IN AS
                      <button
                        aria-label="Close account menu"
                        onClick={() => setRoles(false)}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                    <div className="account-card">
                      <span className="avatar">{actor.initials}</span>
                      <span>
                        <strong>{actor.name}</strong>
                        <small>{actor.role}</small>
                        <small className="mono">
                          {accountFor(actor.id)?.email}
                        </small>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setRoles(false);
                        signOut();
                      }}
                    >
                      <SignOutIcon size={18} />
                      <span>
                        <strong>Sign out</strong>
                        <small>Sign in as another persona to switch</small>
                      </span>
                    </button>
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
              <ArrowUpRightIcon size={13} />
            </Link>
          </div>
          {storageWarning && (
            <div className="notice amber">
              Local storage is unavailable. Progress will last only while this
              page stays open. Export your source data before leaving.
            </div>
          )}
          <main>{children}</main>
          <footer className="workspace-footer">
            <span>NLNG · People & Payroll</span>
            <span>Synthetic records. No actual payments.</span>
          </footer>
        </div>
      </div>
    </IconContext.Provider>
  );
}
