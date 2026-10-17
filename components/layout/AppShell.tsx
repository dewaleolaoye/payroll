"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  SquaresFourIcon,
  UsersThreeIcon,
  SealCheckIcon,
  ClockCountdownIcon,
  SignOutIcon,
  WalletIcon,
  CaretDownIcon,
  ListIcon,
  XIcon,
  LeafIcon,
  IconContext,
} from "@phosphor-icons/react";
import { displayDate } from "@/lib/domain/model";
import { accountFor } from "@/lib/auth/accounts";
import { useApp } from "@/features/app/AppProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PageHeaderContext, type PageHeader } from "./PageHeader";
const navigation = [
  { href: "/", label: "Overview", icon: SquaresFourIcon },
  { href: "/employees", label: "Employees", icon: UsersThreeIcon },
  { href: "/approvals", label: "Approvals", icon: SealCheckIcon },
  { href: "/exits", label: "Exits", icon: SignOutIcon },
  { href: "/payroll", label: "Payroll", icon: WalletIcon },
  { href: "/sla", label: "SLA", icon: ClockCountdownIcon },
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
  const { state, actor, today, ready, storageWarning, signedIn, signOut } =
    useApp();
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState(false);
  const [header, setHeader] = useState<PageHeader | null>(null);
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
    )?.label ?? "";
  const pending =
    state.employees.filter((e) => e.approval === "Pending").length +
    state.exits.filter((x) => x.status === "Pending").length;
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
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="topbar-title">
              <button
                className="mobile-menu"
                aria-label="Open navigation"
                onClick={() => setOpen(true)}
              >
                <ListIcon size={20} />
              </button>
              <div>
                <h1>{header?.title ?? title}</h1>
                {header?.description && <p>{header.description}</p>}
              </div>
            </div>
            <div className="topbar-right">
              <ThemeToggle />
              <span className="top-date">{displayDate(today)}</span>
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
                        <small>End this session</small>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          {storageWarning && (
            <div className="notice amber">
              Local storage is unavailable. Progress will last only while this
              page stays open.
            </div>
          )}
          <main>
            <PageHeaderContext.Provider value={setHeader}>
              {children}
            </PageHeaderContext.Provider>
          </main>
          <footer className="workspace-footer">
            <span>NLNG · People & Payroll</span>
          </footer>
        </div>
      </div>
    </IconContext.Provider>
  );
}
