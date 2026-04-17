'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl font-medium">משהו השתבש</h1>
      <p className="text-muted">
        קרתה תקלה בטעינת הדף. נסו שוב בעוד רגע.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90"
      >
        נסו שוב
      </button>
    </section>
  );
}
