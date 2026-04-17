'use client';

import { useEffect } from 'react';
import { useBasket } from './basket-provider';
import {
  basketSubtotal,
  buildMailtoUrl,
  buildWhatsAppUrl,
} from './basket-link-builder';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function BasketDrawer() {
  const { state, drawerOpen, closeDrawer, setQuantity, removeItem } = useBasket();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const items = state.items;
  const total = basketSubtotal(items);
  const waUrl = buildWhatsAppUrl(items, WHATSAPP_NUMBER);
  const mailUrl = buildMailtoUrl(items, CONTACT_EMAIL);
  const contactConfigured = Boolean(WHATSAPP_NUMBER && CONTACT_EMAIL);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="הסל שלי"
    >
      <button
        type="button"
        aria-label="סגור"
        onClick={closeDrawer}
        className="absolute inset-0 bg-foreground/40"
      />
      <aside className="absolute inset-y-0 right-0 flex h-full w-full flex-col bg-surface shadow-[0_10px_30px_rgba(31,27,23,0.12)] sm:w-[420px]">
        <header className="flex items-center justify-between border-b border-[#E8DEC9] px-5 py-4">
          <h2 className="font-display text-xl font-medium">הסל שלי</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="סגור"
            className="text-muted transition-opacity duration-200 hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-muted">
              הסל ריק. הוסיפ/י פריטים כדי להתחיל.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base">{item.name}</p>
                    <p className="text-sm text-muted">
                      ₪{PRICE_FORMAT.format(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      aria-label="הפחת כמות"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E8DEC9] text-foreground transition-opacity duration-200 hover:opacity-70"
                    >
                      −
                    </button>
                    <span
                      aria-label={`כמות: ${item.quantity}`}
                      className="min-w-[20px] text-center text-base"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      aria-label="הגדל כמות"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E8DEC9] text-foreground transition-opacity duration-200 hover:opacity-70"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="הסר מהסל"
                      className="ml-1 text-muted transition-opacity duration-200 hover:opacity-70"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-[#E8DEC9] px-5 py-4">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-base text-muted">סה&quot;כ</span>
              <span className="font-display text-xl">
                ₪{PRICE_FORMAT.format(total)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={waUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!contactConfigured}
                onClick={(e) => {
                  if (!contactConfigured) e.preventDefault();
                }}
                className={`flex h-11 items-center justify-center rounded-md bg-primary px-4 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90 ${
                  contactConfigured ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                שלח/י בוואטסאפ
              </a>
              <a
                href={mailUrl ?? '#'}
                aria-disabled={!contactConfigured}
                onClick={(e) => {
                  if (!contactConfigured) e.preventDefault();
                }}
                className={`flex h-11 items-center justify-center rounded-md border border-primary px-4 text-base font-medium text-primary transition-opacity duration-200 hover:opacity-70 ${
                  contactConfigured ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                שלח/י באימייל
              </a>
              {!contactConfigured ? (
                <p className="text-center text-sm text-muted">
                  הגדרות יצירת קשר חסרות
                </p>
              ) : null}
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8l1-13" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
