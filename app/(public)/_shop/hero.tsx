const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

export function Hero() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4 text-center sm:min-h-[80vh]">
      <h1 className="font-display text-5xl font-medium text-foreground sm:text-6xl">
        {businessName}
      </h1>
      <p className="text-lg text-muted">כל סלסלה נארזת באהבה</p>
      <a
        href="#catalog"
        aria-label="לקטלוג"
        className="mt-4 text-muted transition-opacity duration-200 hover:opacity-70"
      >
        <ChevronDown />
      </a>
    </section>
  );
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
