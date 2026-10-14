import Link from "next/link";
export default function NotFound() {
  return (
    <section className="surface empty">
      <h3>Page not found</h3>
      <p>This page doesn’t exist. Open the overview to continue.</p>
      <Link href="/" className="button">
        Back to overview
      </Link>
    </section>
  );
}
