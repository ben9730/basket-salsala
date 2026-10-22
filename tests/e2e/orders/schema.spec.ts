import { test, expect } from '@playwright/test';
import { placeOrderSchema, adminOrderSchema } from '../../../lib/orders/schema';

const id = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const base = { name: ' דנה ', phone: '052-123 4567', dueDate: '2026-10-30', items: [{ id, quantity: 2 }] };

test.describe('placeOrderSchema', () => {
  test('trims name, normalises phone, drops empty note', () => {
    const r = placeOrderSchema.parse({ ...base, note: '   ' });
    expect(r.name).toBe('דנה');
    expect(r.phone).toBe('0521234567');
    expect(r.note).toBeUndefined();
  });

  test('rejects bad phone, empty name, bad quantity, empty or oversized basket', () => {
    expect(placeOrderSchema.safeParse({ ...base, phone: '0221234567' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, phone: '05212345' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, items: [{ id, quantity: 0 }] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, items: [{ id, quantity: 100 }] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(
      placeOrderSchema.safeParse({ ...base, items: Array.from({ length: 31 }, () => ({ id, quantity: 1 })) }).success,
    ).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, note: 'x'.repeat(501) }).success).toBe(false);
  });
});

test.describe('adminOrderSchema', () => {
  const admin = {
    name: 'דנה', phone: '0521234567', dueDate: '2026-10-30', status: 'new', isPaid: false,
    lines: [{ productId: null, productName: 'חלה', unitPrice: 0, quantity: 1 }],
  };
  test('accepts a manual line without product and rejects bad ones', () => {
    expect(adminOrderSchema.safeParse(admin).success).toBe(true);
    expect(adminOrderSchema.safeParse({ ...admin, status: 'done' }).success).toBe(false);
    expect(adminOrderSchema.safeParse({ ...admin, lines: [] }).success).toBe(false);
    expect(
      adminOrderSchema.safeParse({ ...admin, lines: [{ ...admin.lines[0], unitPrice: -1 }] }).success,
    ).toBe(false);
  });
});
