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
    <footer className="relative mt-24 overflow-hidden bg-gradient-to-b from-white to-blue-50/40">
      <div className="deco-circle -left-24 top-1/3 h-80 w-80 opacity-30" />
      <div className="deco-circle -right-20 -bottom-20 h-72 w-72 opacity-20" />

      <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-12 text-center sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-4 py-2 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              פתוחים להזמנות
            </span>
          </span>

          <h2 className="mt-5 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            <span className="bg-gradient-to-l from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              דברו איתנו
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
            שלחו הזמנה או שאלה ואנחנו חוזרים אליכם. הכי מהר בוואטסאפ.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {PHONE ? (
            <a
              href={`https://wa.me/${PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-blue-600 to-cyan-500 text-white shadow-md">
                <WhatsAppIcon />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                WhatsApp
              </span>
              <span className="font-display text-lg font-medium text-slate-900 group-hover:text-blue-600">
                {phoneHuman}
              </span>
            </a>
          ) : null}

          {EMAIL ? (
            <a
              href={`mailto:${EMAIL}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-blue-600 to-cyan-500 text-white shadow-md">
                <EmailIcon />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Email
              </span>
              <span className="font-display text-lg font-medium text-slate-900 group-hover:text-blue-600 break-all">
                {EMAIL}
              </span>
            </a>
          ) : null}

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-blue-600 to-cyan-500 text-white shadow-md">
              <PinIcon />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              איסוף
            </span>
            <span className="font-display text-lg font-medium text-slate-900">
              יבנה
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 border-t border-blue-100 pt-8 sm:flex-row sm:justify-between">
          <p className="text-sm text-slate-500">© Salsala · נארזת באהבה</p>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <LockIcon />
            <span>כניסה לניהול</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
