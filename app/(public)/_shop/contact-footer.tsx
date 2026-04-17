const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

function formatPhoneIL(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('972') && raw.length >= 11) {
    const local = '0' + raw.slice(3);
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return raw;
}

export function ContactFooter() {
  const phoneHuman = formatPhoneIL(PHONE);

  return (
    <footer className="mt-16 border-t border-[#E8DEC9] bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-center sm:gap-6">
        {PHONE ? (
          <a
            href={`https://wa.me/${PHONE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity duration-200 hover:opacity-70"
          >
            {phoneHuman}
          </a>
        ) : null}
        {PHONE && EMAIL ? <span aria-hidden="true">·</span> : null}
        {EMAIL ? (
          <a
            href={`mailto:${EMAIL}`}
            className="transition-opacity duration-200 hover:opacity-70"
          >
            {EMAIL}
          </a>
        ) : null}
        {EMAIL ? <span aria-hidden="true">·</span> : null}
        <span>איסוף עצמי ביבנה</span>
      </div>
      <div className="flex items-center justify-center gap-4 pb-6 text-xs">
        <span className="text-muted">© Salsala</span>
        <a
          href="/admin/login"
          className="inline-flex items-center gap-1 font-medium text-blue-600 underline underline-offset-4 transition hover:opacity-80"
        >
          <LockIcon />
          ניהול
        </a>
      </div>
    </footer>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
