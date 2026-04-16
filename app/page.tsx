export default function Home() {
  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
        {businessName}
      </h1>
      <p className="text-lg text-neutral-600">
        האתר בהכנה. חוזרים אליכם בקרוב עם הזמנות טריות.
      </p>
    </main>
  );
}
