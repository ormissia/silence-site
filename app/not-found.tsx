import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-32 md:px-10">
      <p className="eyebrow">Error 404 — Page Not Found</p>
      <h1 className="mt-6 font-sans text-display">
        This <span className="italic">plate</span> was lost in the post.
      </h1>
      <Link
        href="/"
        className="mt-12 inline-block border-b border-ink pb-1 font-sans text-sm uppercase tracking-[0.24em] hover:text-accent hover:border-accent"
      >
        ← Back to issue
      </Link>
    </section>
  );
}
