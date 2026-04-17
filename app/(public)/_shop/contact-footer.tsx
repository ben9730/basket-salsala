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
      <p className="flex items-center justify-center gap-3 pb-6 text-center text-xs text-muted">
        <span>© Salsala</span>
        <span aria-hidden="true">·</span>
        <a
          href="/admin/login"
          className="underline-offset-4 transition hover:text-foreground hover:underline"
        >
          ניהול
        </a>
      </p>
    </footer>
  );
}
