export default function Home() {
  const businessName =
    process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

  return (
    <main className="hero-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <div className="deco-circle -top-20 -left-20 h-72 w-72 opacity-60" />
      <div className="deco-circle -bottom-32 -right-32 h-96 w-96 opacity-40" />
      <div className="deco-circle left-1/4 top-1/3 h-48 w-48 opacity-30" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-4 py-2 backdrop-blur-xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          <span className="text-sm font-medium text-slate-600">
            בקרוב — הזמנות פתוחות
          </span>
        </div>

        <h1 className="font-display text-5xl font-bold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-l from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {businessName}
          </span>
        </h1>

        <p className="max-w-md text-lg leading-relaxed text-slate-600">
          מאפים וארוחות מהמטבח של שלומי ובת-חן. האתר בהכנה — חוזרים אליכם בקרוב
          עם הזמנות טריות.
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            הזמנה מראש
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl">
            <svg
              className="h-4 w-4 text-cyan-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            איסוף עצמי
          </span>
        </div>
      </div>
    </main>
  );
}
