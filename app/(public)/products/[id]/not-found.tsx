import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl font-medium">המוצר לא נמצא</h1>
      <p className="text-muted">
        אולי הוסר מהקטלוג. חזרו לעמוד הראשי.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90"
      >
        חזרה לחנות
      </Link>
    </section>
  );
}
