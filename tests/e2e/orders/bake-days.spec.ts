import { test, expect } from '@playwright/test';
import {
  formatBakeDay,
  isOrderable,
  upcomingBakeDays,
} from '../../../lib/orders/bake-days';

// 2026-10-22 is a Thursday. Israel is UTC+3 until 2026-10-25 (DST ends), then UTC+2.
test.describe('bake days (Asia/Jerusalem)', () => {
  test('Thursday 19:59 -> that Friday is orderable', () => {
    const now = new Date('2026-10-22T16:59:00Z'); // 19:59 IDT
    expect(isOrderable('2026-10-23', now)).toBe(true);
    expect(upcomingBakeDays(now)[0]).toBe('2026-10-23');
  });

  test('Thursday 20:00 -> that Friday is closed, next one is first', () => {
    const now = new Date('2026-10-22T17:00:00Z'); // 20:00 IDT
    expect(isOrderable('2026-10-23', now)).toBe(false);
    expect(upcomingBakeDays(now)).toEqual([
      '2026-10-30',
      '2026-11-06',
      '2026-11-13',
      '2026-11-20',
    ]);
  });

  test('Friday -> next Friday, never today', () => {
    const now = new Date('2026-10-23T07:00:00Z');
    expect(isOrderable('2026-10-23', now)).toBe(false);
    expect(upcomingBakeDays(now)[0]).toBe('2026-10-30');
  });

  test('Saturday query', () => {
    const now = new Date('2026-10-24T10:00:00Z');
    expect(upcomingBakeDays(now, 2)).toEqual(['2026-10-30', '2026-11-06']);
  });

  test('uses Israel date, not UTC: Thursday 23:30 Israel is still Thursday', () => {
    const now = new Date('2026-10-22T20:30:00Z'); // 23:30 IDT, past cutoff
    expect(isOrderable('2026-10-23', now)).toBe(false);
    // Wed 21:30 UTC is already Thu 00:30 in Israel summer time, before cutoff.
    expect(isOrderable('2026-10-23', new Date('2026-10-21T21:30:00Z'))).toBe(true);
  });

  test('DST end: Thursday 2026-10-29 is UTC+2, cutoff 20:00 = 18:00Z', () => {
    expect(isOrderable('2026-10-30', new Date('2026-10-29T17:59:00Z'))).toBe(true);
    expect(isOrderable('2026-10-30', new Date('2026-10-29T18:00:00Z'))).toBe(false);
  });

  test('DST start (2027-03-26 is the Friday after the switch)', () => {
    // Israel switches to UTC+3 on Friday 2027-03-26 at 02:00. Cutoff Thursday 20:00 is still UTC+2 -> 18:00Z.
    expect(isOrderable('2027-03-26', new Date('2027-03-25T17:59:00Z'))).toBe(true);
    expect(isOrderable('2027-03-26', new Date('2027-03-25T18:00:00Z'))).toBe(false);
    // Friday 2027-04-02, cutoff Thursday 04-01 is UTC+3 -> 17:00Z.
    expect(isOrderable('2027-04-02', new Date('2027-04-01T16:59:00Z'))).toBe(true);
    expect(isOrderable('2027-04-02', new Date('2027-04-01T17:00:00Z'))).toBe(false);
  });

  test('rejects non-bake weekdays and invalid dates', () => {
    const now = new Date('2026-10-20T08:00:00Z');
    expect(isOrderable('2026-10-24', now)).toBe(false); // Saturday
    expect(isOrderable('2026-02-30', now)).toBe(false);
    expect(isOrderable('garbage', now)).toBe(false);
  });

  test('formatBakeDay', () => {
    expect(formatBakeDay('2026-10-23')).toBe('שישי 23.10');
  });
});
