import Link from "next/link";
export default function NotFound() {
  return (
    <section className="surface empty">
      <h3>Page not found</h3>
      <p>Open the overview to continue your payroll walkthrough.</p>
      <Link href="/" className="button">
        Back to overview
      </Link>
    </section>
  );
}
