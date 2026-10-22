# Distribution days + Friday-only products — Implementation Plan

**Goal:** The owner distributes every day except Shabbat, not only Fridays. Some products (the challahs) exist only on Friday. Customers can pick any distribution day before its cutoff. A basket with a Friday-only product can only be picked up on a Friday, and the database enforces that.

**Builds on:** `docs/superpowers/plans/2026-10-22-orders.md` (shipped to `staging` as `fa987e6`). Read it and `GLOSSARY.md` first. The new terms are **Distribution day** (code keeps the name `bake-days`) and **Friday-only product**.

**Decisions (design interview Q23–Q28, 2026-10-22):**
- Distribution days: **Sunday–Friday** (no Shabbat). Assumed until the owner confirms (question 1 in the vault note).
- Cutoff: **16:00 the day before** each distribution day, so Saturday 16:00 for Sunday. Assumed until she confirms (question 2).
- Each product gets a **"שישי בלבד"** toggle in the admin product form. She sets it herself on the challahs. Don't guess by name.
- A basket containing any Friday-only product → the pickup picker offers **only Fridays**, with a one-line hint. The card and product page show a small "שישי בלבד" tag.
- `place_order()` rejects a Friday-only product on a non-Friday. Admin manual orders stay unrestricted (owner override).
- Hebrew labels the owner sees say **יום חלוקה**, not "יום אפייה". The customer label "יום איסוף" stays.

**Not in this plan (waiting on the owner):** the "profit" summary (revenue vs. after ingredient cost) and the neighbours' door question. See the vault note `Basket Salsala - שאלות המשך לאחותי (2026-10-22 13:49)`.

**Guardrails (same as the orders plan):** Next.js 16.2.4 (read `node_modules/next/dist/docs/`), no new dependencies, single quotes, **no prettier**, Hebrew RTL, mobile-first, design tokens, `focus-visible` + 44px targets. Don't commit. **Don't touch the live DB:** the orchestrator applies migrations through the Supabase MCP after review. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npx playwright test tests/e2e/shop tests/e2e/orders tests/e2e/smoke.spec.ts`. `.env.local` exists now and points at the real DB, so don't place real orders from tests.

**Skills per step (the user requires Matt Pocock's skills, named in every agent prompt):**
| Step | Skill |
|---|---|
| Agent prompts | `mattpocock-skills:writing-for-agents` |
| Task 1 date logic | `mattpocock-skills:tdd` |
| Task 2 SQL | `supabase:supabase-postgres-best-practices` + `mattpocock-skills:tdd` (rollback tests via MCP) |
| Task 3–4 UI / data shape | `mattpocock-skills:codebase-design` |
| After each task | `mattpocock-skills:code-review` (standards + spec, two Sonnet sub-agents) |
| Anything red | `mattpocock-skills:diagnosing-bugs` |
| Terms | `mattpocock-skills:domain-modeling` (update `GLOSSARY.md` if a term moves) |

Build agents run on **Sonnet**.

---

## Task 1 — Distribution days + 16:00 cutoff (`mattpocock-skills:tdd`)

`lib/orders/bake-days.ts`:
- `BAKE_WEEKDAYS = [0, 1, 2, 3, 4, 5]`, `CUTOFF_HOUR = 16`, `CUTOFF_DAYS_BEFORE = 1`. Update the "assumed until the owner confirms" comment.
- `upcomingBakeDays(now, count = 7, opts?: { fridayOnly?: boolean })`. When `fridayOnly` is set, return only Fridays (still `count` of them, still past-cutoff filtered).
- Add `isOrderable(date, now, opts?: { fridayOnly?: boolean })` with the same rule.

Tests first, in `tests/e2e/orders/bake-days.spec.ts` (rewrite the Friday/20:00 cases):
- Thursday 15:59 → Friday orderable; Thursday 16:00 → not.
- Saturday 15:59 → Sunday orderable; Saturday 16:00 → not.
- Saturday is never returned.
- `fridayOnly` from Sunday → the next Friday.
- `fridayOnly` from Thursday 16:00 → the Friday after next.
- DST end 2026-10-25 and DST start 2027-03-26, checked to the minute.

`lib/orders/day-sheet.ts`: `defaultDaySheetDate` and `adjacentBakeDay` already loop `BAKE_WEEKDAYS`. Update the `day-sheet.spec.ts` expectations: Saturday → Sunday, and Thursday after the cutoff → tomorrow still holds.

Admin labels in `app/admin/(protected)/orders/page.tsx`: "יום אפייה קודם/הבא" → "יום חלוקה קודם/הבא".

## Task 2 — `is_friday_only` in the DB (`supabase-postgres-best-practices`)

New `supabase/migrations/0004_friday_only.sql`:
- `alter table public.products add column is_friday_only boolean not null default false;`
- `create or replace function public.place_order(...)` with the **same signature and body as 0003**, plus, before inserting the order:
  ```sql
  if extract(dow from p_due_date) <> 5 and exists (
    select 1 from public.products p
    where p.is_friday_only
      and p.id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_lines) e)
  ) then
    raise exception 'friday only';
  end if;
  ```
- Re-state the grants (`revoke ... from public; grant execute ... to anon, authenticated`).
- Keep `#variable_conflict use_column` and `set search_path = public`.

`app/(public)/actions.ts`: map the `friday only` error to `'בסל יש מוצרים של שישי בלבד – בחר/י יום שישי'`. Pass `fridayOnly` into `isOrderable`. The action knows it only from the client, so the SQL check is the real guard.

`lib/products/queries.ts`: add `is_friday_only` to `ProductRow` and to all three selects.

**The orchestrator applies 0004 via the Supabase MCP**, then runs rollback tests as `anon` (`begin; set local role anon; ... rollback;`):
- a Friday-only product on a Sunday → `friday only`
- the same product on a Friday → ok
- a normal product on a Sunday → ok

## Task 3 — Admin product toggle (`mattpocock-skills:codebase-design`)

- `lib/products/schema.ts`: `is_friday_only: z.boolean()`, parsed like `is_available`.
- `_components/product-form.tsx`: a "שישי בלבד" checkbox next to "זמין", same markup pattern.
- `products/new/actions.ts` and `products/[id]/edit/actions.ts` + `edit/page.tsx`: pass the field through.
- `app/admin/(protected)/page.tsx` product list: a small "שישי בלבד" tag, like the existing unavailable tag.
- Admin `OrderForm` stays unrestricted.

## Task 4 — Customer flow (`mattpocock-skills:codebase-design`)

- `components/basket/types.ts`: `BasketItem.fridayOnly?: boolean`. Optional, so baskets saved before this change still load (missing = false; the server still guards).
- `AddToBasketButton`: a new `fridayOnly` prop, stored on add. Pass it from `product-card.tsx` and `product-detail.tsx`.
- Card + product detail: a small "שישי בלבד" tag (token colours, not a new colour).
- `basket-drawer.tsx`:
  - `const fridayOnly = items.some((i) => i.fridayOnly)`
  - The picker uses `upcomingBakeDays(now, 7, { fridayOnly })`.
  - When `fridayOnly`, show the hint `'בסל יש מוצרים של שישי בלבד, לכן האיסוף ביום שישי'`.
  - If the currently selected date is no longer in the list, reset it to the first option.
- `tests/e2e/shop/basket-flow.spec.ts`: one assertion that the picker shows a non-Friday option when the basket has no Friday-only item. Don't depend on real catalog flags for Friday-only.

## Done when

- [ ] All checks green (tsc, lint, build, e2e).
- [ ] `0004` applied and the three rollback tests pass.
- [ ] `code-review` run per task.
- [ ] Pushed to `staging` (remote `git@github-ben9730:...`, author BenG).
- [ ] Ben and the owner test on the staging Share link.
- [ ] The owner marks the challahs as Friday-only and adds חלת בריוש.
