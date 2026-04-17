'use client';

import { Button } from '@/components/ui/button';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display mb-2 text-2xl font-medium">משהו השתבש</h1>
      <p className="mb-6 text-sm text-neutral-600">
        לא הצלחנו לטעון את העמוד. נסי שוב בעוד רגע.
      </p>
      <Button onClick={reset} variant="primary" size="md">
        נסי שוב
      </Button>
    </section>
  );
}
