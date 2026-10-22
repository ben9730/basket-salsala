import { test, expect } from '@playwright/test';
import {
  formatBakeDay,
  isOrderable,
  upcomingBakeDays,
} from '../../../lib/orders/bake-days';

// 2026-10-22 is a Thursday. Israel is UTC+3 until 2026-10-25 02:00 (DST ends), then UTC+2.
test.describe('bake days (Asia/Jerusalem)', () => {
  test('Thursday 15:59 -> Friday orderable; 16:00 -> not', () => {
    expect(isOrderable('2026-10-23', new Date('2026-10-22T12:59:00Z'))).toBe(true); // 15:59 IDT
    expect(isOrderable('2026-10-23', new Date('2026-10-22T13:00:00Z'))).toBe(false); // 16:00 IDT
  });

  test('Sunday 15:59 -> Monday orderable; 16:00 -> not', () => {
    expect(isOrderable('2026-10-26', new Date('2026-10-25T13:59:00Z'))).toBe(true); // 15:59 IST
    expect(isOrderable('2026-10-26', new Date('2026-10-25T14:00:00Z'))).toBe(false); // 16:00 IST
  });

  test('Thursday 16:00 -> first upcoming day is Monday', () => {
    expect(upcomingBakeDays(new Date('2026-10-22T13:00:00Z'), 3)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
    ]);
  });

  test('Saturday and Sunday are never returned', () => {
    const days = upcomingBakeDays(new Date('2026-10-20T08:00:00Z'), 14);
    expect(days).toHaveLength(14);
    for (const d of days) expect([0, 6]).not.toContain(new Date(`${d}T00:00:00Z`).getUTCDay());
  });

  test('fridayOnly from Sunday -> the next Friday', () => {
    const now = new Date('2026-10-25T08:00:00Z');
    expect(upcomingBakeDays(now, 2, { fridayOnly: true })).toEqual(['2026-10-30', '2026-11-06']);
    expect(isOrderable('2026-10-26', now, { fridayOnly: true })).toBe(false);
    expect(isOrderable('2026-10-30', now, { fridayOnly: true })).toBe(true);
  });

  test('fridayOnly from Thursday 16:00 -> the Friday after next', () => {
    const now = new Date('2026-10-22T13:00:00Z');
    expect(upcomingBakeDays(now, 2, { fridayOnly: true })).toEqual(['2026-10-30', '2026-11-06']);
  });

  test('uses Israel date, not UTC: Thursday 23:30 Israel is past cutoff', () => {
    const now = new Date('2026-10-22T20:30:00Z'); // 23:30 IDT
    expect(isOrderable('2026-10-23', now)).toBe(false);
    // Wed 21:30 UTC is already Thu 00:30 in Israel summer time, before cutoff.
    expect(isOrderable('2026-10-23', new Date('2026-10-21T21:30:00Z'))).toBe(true);
  });

  test('DST end 2026-10-25: Thursday cutoff is UTC+3, Sunday cutoff is UTC+2', () => {
    // Friday 10-23 closes Thursday 16:00 IDT = 13:00Z.
    expect(isOrderable('2026-10-23', new Date('2026-10-22T12:59:00Z'))).toBe(true);
    expect(isOrderable('2026-10-23', new Date('2026-10-22T13:00:00Z'))).toBe(false);
    // Monday 10-26 closes Sunday 16:00 IST (already UTC+2) = 14:00Z.
    expect(isOrderable('2026-10-26', new Date('2026-10-25T13:59:00Z'))).toBe(true);
    expect(isOrderable('2026-10-26', new Date('2026-10-25T14:00:00Z'))).toBe(false);
  });

  test('DST start 2027-03-26 (Friday 02:00 switches to UTC+3)', () => {
    // Friday 03-26 closes Thursday 16:00 IST (UTC+2) = 14:00Z.
    expect(isOrderable('2027-03-26', new Date('2027-03-25T13:59:00Z'))).toBe(true);
    expect(isOrderable('2027-03-26', new Date('2027-03-25T14:00:00Z'))).toBe(false);
    // Monday 03-29 closes Sunday 16:00 IDT (UTC+3) = 13:00Z.
    expect(isOrderable('2027-03-29', new Date('2027-03-28T12:59:00Z'))).toBe(true);
    expect(isOrderable('2027-03-29', new Date('2027-03-28T13:00:00Z'))).toBe(false);
  });

  test('rejects Saturday, Sunday and invalid dates', () => {
    const now = new Date('2026-10-20T08:00:00Z');
    expect(isOrderable('2026-10-24', now)).toBe(false); // Saturday
    expect(isOrderable('2026-10-25', now)).toBe(false); // Sunday
    expect(isOrderable('2026-02-30', now)).toBe(false);
    expect(isOrderable('garbage', now)).toBe(false);
  });

  test('formatBakeDay', () => {
    expect(formatBakeDay('2026-10-23')).toBe('שישי 23.10');
  });
});
