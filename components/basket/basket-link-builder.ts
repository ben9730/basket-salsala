import { formatBakeDay } from '@/lib/orders/bake-days';
import type { BasketItem } from './types';

export type OrderDetails = {
  orderNumber: number;
  name: string;
  phone: string;
  dueDate: string;
  note?: string;
};

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

export function buildMessageBody(
  items: BasketItem[],
  details?: OrderDetails,
): string {
  const lines = items.map(
    (item) =>
      `• ${item.name} × ${item.quantity} — ₪${formatPrice(item.price)}`,
  );
  const total = basketSubtotal(items);
  const head = details
    ? [`שלום! הזמנה #${details.orderNumber}`, `שם: ${details.name}`, `טלפון: ${details.phone}`, `איסוף: ${formatBakeDay(details.dueDate)}`]
    : ['שלום! אני מעוניין/ת להזמין:'];
  return [
    ...head,
    '',
    ...lines,
    '',
    `סה"כ: ₪${formatPrice(total)}`,
    ...(details?.note ? ['', `הערה: ${details.note}`] : []),
  ].join('\n');
}

export function buildWhatsAppUrl(
  items: BasketItem[],
  number: string | undefined,
  details?: OrderDetails,
): string | null {
  if (!number) return null;
  const body = buildMessageBody(items, details);
  return `https://wa.me/${number}?text=${encodeURIComponent(body)}`;
}

export function buildMailtoUrl(
  items: BasketItem[],
  email: string | undefined,
  details?: OrderDetails,
): string | null {
  if (!email) return null;
  const subject = details
    ? `הזמנה חדשה מסלסלה #${details.orderNumber}`
    : 'הזמנה חדשה מסלסלה';
  const body = buildMessageBody(items, details);
  return `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
