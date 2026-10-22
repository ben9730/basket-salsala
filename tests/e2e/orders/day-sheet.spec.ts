import { test, expect } from '@playwright/test';
import {
  adjacentBakeDay,
  bakeList,
  daySheetTotals,
  defaultDaySheetDate,
  itemsText,
} from '../../../lib/orders/day-sheet';

type Line = { product_id: string | null; product_name: string; unit_price: number; quantity: number };
function order(over: Partial<{ status: string; is_paid: boolean; lines: Line[] }> = {}) {
  return {
    status: 'new',
    is_paid: false,
    order_lines: [{ product_id: 'a', product_name: 'חלה', unit_price: 20, quantity: 1 }],
    ...(over.lines ? { order_lines: over.lines } : {}),
    ...(over.status ? { status: over.status } : {}),
    ...(over.is_paid !== undefined ? { is_paid: over.is_paid } : {}),
  } as never;
}
const line = (id: string | null, name: string, price: number, quantity: number): Line => ({
  product_id: id,
  product_name: name,
  unit_price: price,
  quantity,
});

test.describe('bakeList', () => {
  const products = [
    { id: 'a', display_order: 2 },
    { id: 'b', display_order: 1 },
  ];
  test('sums per product, sorted by display_order, cancelled excluded, deleted last', () => {
    const orders = [
      order({ lines: [line('a', 'חלה', 20, 2), line('b', 'בריוש', 30, 1)] }),
      order({ lines: [line('a', 'חלה', 20, 3), line(null, 'ישן', 5, 4)] }),
      order({ status: 'cancelled', lines: [line('b', 'בריוש', 30, 50)] }),
      order({ lines: [line('gone', 'נמחק', 5, 1)] }),
    ];
    expect(bakeList(orders, products)).toEqual([
      { productId: 'b', name: 'בריוש', quantity: 1 },
      { productId: 'a', name: 'חלה', quantity: 5 },
      { productId: null, name: 'ישן', quantity: 4 },
      { productId: 'gone', name: 'נמחק', quantity: 1 },
    ]);
  });
});

test.describe('daySheetTotals', () => {
  test('count, grand, paid, unpaid exclude cancelled', () => {
    const orders = [
      order({ lines: [line('a', 'חלה', 20, 2)], is_paid: true }), // 40 paid
      order({ lines: [line('a', 'חלה', 20, 1), line('b', 'x', 10.5, 2)] }), // 41 unpaid
      order({ status: 'cancelled', is_paid: true, lines: [line('a', 'חלה', 20, 9)] }),
    ];
    expect(daySheetTotals(orders)).toEqual({ count: 2, grand: 81, paid: 40, unpaid: 41 });
  });
  test('empty', () => {
    expect(daySheetTotals([])).toEqual({ count: 0, grand: 0, paid: 0, unpaid: 0 });
  });
});

test('itemsText', () => {
  expect(itemsText(order({ lines: [line('a', 'חלת בריוש', 1, 2), line('b', 'עוגיות', 1, 1)] }))).toBe(
    'חלת בריוש ×2, עוגיות ×1',
  );
});

test.describe('defaultDaySheetDate', () => {
  test('Friday daytime (cutoff for it passed yesterday) -> today', () => {
    expect(defaultDaySheetDate(new Date('2026-10-23T09:00:00Z'))).toBe('2026-10-23');
  });
  test('Sunday 15:59 -> tomorrow (Monday)', () => {
    expect(defaultDaySheetDate(new Date('2026-10-25T13:59:00Z'))).toBe('2026-10-26');
  });
  // After the cutoff customers can't order for tomorrow, but the owner still needs tomorrow's sheet.
  test('Sunday 16:00 (after cutoff) -> still tomorrow (Monday)', () => {
    expect(defaultDaySheetDate(new Date('2026-10-25T14:00:00Z'))).toBe('2026-10-26');
  });
  test('Saturday -> Monday', () => {
    expect(defaultDaySheetDate(new Date('2026-10-24T10:00:00Z'))).toBe('2026-10-26');
  });
});

test('adjacentBakeDay', () => {
  expect(adjacentBakeDay('2026-10-23', 1)).toBe('2026-10-26'); // Friday -> Monday, skips the weekend
  expect(adjacentBakeDay('2026-10-26', -1)).toBe('2026-10-23'); // Monday -> Friday
  expect(adjacentBakeDay('2026-10-24', -1)).toBe('2026-10-23'); // from Saturday
  expect(adjacentBakeDay('2026-10-25', 1)).toBe('2026-10-26'); // from Sunday
});
