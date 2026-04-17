import type { BasketItem } from './types';

const CURRENCY_FORMATTER = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatPrice(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

export function basketSubtotal(items: BasketItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function buildMessageBody(items: BasketItem[]): string {
  const lines = items.map(
    (item) =>
      `• ${item.name} × ${item.quantity} — ₪${formatPrice(item.price)}`,
  );
  const total = basketSubtotal(items);
  return [
    'שלום! אני מעוניין/ת להזמין:',
    '',
    ...lines,
    '',
    `סה"כ: ₪${formatPrice(total)}`,
    '',
    'שמי: _____',
  ].join('\n');
}

export function buildWhatsAppUrl(
  items: BasketItem[],
  number: string | undefined,
): string | null {
  if (!number) return null;
  const body = buildMessageBody(items);
  return `https://wa.me/${number}?text=${encodeURIComponent(body)}`;
}

export function buildMailtoUrl(
  items: BasketItem[],
  email: string | undefined,
): string | null {
  if (!email) return null;
  const subject = 'הזמנה חדשה מסלסלה';
  const body = buildMessageBody(items);
  return `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
