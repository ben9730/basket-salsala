const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

export function Hero() {
  return (
    <section className="hero-bg relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24">
      <div className="deco-circle -left-20 -top-20 h-72 w-72 opacity-60" />
      <div className="deco-circle -bottom-32 -right-32 h-96 w-96 opacity-40" />
      <div className="deco-circle left-1/4 top-1/3 h-48 w-48 opacity-30" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="font-display text-5xl font-bold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-l from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {businessName}
          </span>
        </h1>

        <p className="max-w-md text-lg leading-relaxed text-slate-600">
          כל סלסלה נארזת באהבה
        </p>

        <a
          href="#catalog"
          aria-label="לקטלוג"
          className="mt-2 text-slate-400 transition-opacity duration-200 hover:opacity-70"
        >
          <ChevronDown />
        </a>
      </div>
    </section>
  );
}

function ChevronDown() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
