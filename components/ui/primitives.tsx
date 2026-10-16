"use client";
import { useEffect, useRef, useState } from "react";
import {
  XIcon,
  ArrowRightIcon,
  TrayIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSetPageHeader } from "@/components/layout/PageHeader";
// The title and description render in the shell's top bar; only the actions
// render in place. `eyebrow` is accepted for existing callers but not shown.
export function PageHeading({
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const setHeader = useSetPageHeader();
  useEffect(() => {
    setHeader({ title, description });
    return () => setHeader(null);
  }, [setHeader, title, description]);
  return children ? <div className="page-actions">{children}</div> : null;
}
export const PAGE_SIZE = 10;
// Returns to page 1 whenever `resetKey` changes (e.g. a new search or tab).
export function usePagination<T>(rows: T[], resetKey = "") {
  const [state, setState] = useState({ page: 1, key: resetKey });
  if (state.key !== resetKey) setState({ page: 1, key: resetKey });
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(state.key === resetKey ? state.page : 1, pageCount);
  return {
    page,
    pageCount,
    total: rows.length,
    pageRows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    setPage: (p: number) => setState({ page: p, key: resetKey }),
  };
}
export function Pagination({
  page,
  pageCount,
  total,
  setPage,
  noun = "records",
}: {
  page: number;
  pageCount: number;
  total: number;
  setPage: (page: number) => void;
  noun?: string;
}) {
  if (!total) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="table-foot pagination">
      <span>
        Showing {from}–{to} of {total} {noun}
      </span>
      {pageCount > 1 && (
        <nav aria-label="Pagination">
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <CaretLeftIcon size={14} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              aria-current={p === page ? "page" : undefined}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <CaretRightIcon size={14} />
          </button>
        </nav>
      )}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "neutral" | "red" | "blue";
}) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function Empty({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty">
      <TrayIcon size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="button secondary" href={href}>
          {action}
          <ArrowRightIcon size={15} />
        </Link>
      )}
    </div>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const targets = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
          ) ?? [],
        );
        if (!targets.length) {
          e.preventDefault();
          return;
        }
        const first = targets[0],
          last = targets[targets.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <XIcon size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function EmployeeName({ name, id }: { name: string; id: string }) {
  return (
    <Link href={`/employees/${id}`} className="employee-name">
      <span className="avatar small">
        {name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")}
      </span>
      <span>
        <strong>{name}</strong>
        <small>{id}</small>
      </span>
    </Link>
  );
}
