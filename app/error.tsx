"use client";
import Link from "next/link";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="surface empty">
      <h3>This screen could not be loaded</h3>
      <p>Your records are still saved. Try again or return to the overview.</p>
      <div className="flex justify-center gap-3">
        <button className="button" onClick={retry}>
          Try again
        </button>
        <Link className="button secondary" href="/">
          Overview
        </Link>
      </div>
    </section>
  );
}
