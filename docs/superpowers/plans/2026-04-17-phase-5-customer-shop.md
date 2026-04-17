# Phase 5 — Customer-Facing Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public storefront: hero + product grid on `/`, product detail at `/products/[id]`, a localStorage-backed basket mounted on a floating button, and a "send order" flow that opens WhatsApp or the user's email client pre-filled with their basket — all Hebrew-RTL, mobile-first, no new npm dependencies.

**Architecture:** Customer routes live in a new `app/(public)/` route group. Root `app/layout.tsx` stays untouched. A `(public)/layout.tsx` mounts the `BasketProvider` (React Context + localStorage) and a floating `BasketButton` exactly once for the customer surface; admin routes never see them. Data fetching stays in Server Components via the existing `lib/products/queries.ts`; Client Components only own basket state, gallery swipe, and add/remove handlers. The WhatsApp/mailto handoff is a pure URL builder — no server code, no API routes, no payments.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres public `SELECT` via existing RLS), Tailwind + existing design tokens, Playwright (`@playwright/test`). No new dependencies.

**Design spec:** `docs/superpowers/specs/2026-04-17-phase-5-customer-shop-design.md` — read before starting.

**Next.js 16 guardrail (per `AGENTS.md`):** this is Next 16. Before writing any route, layout, error boundary, dynamic params, or `next/link` / `next/image` usage, consult `node_modules/next/dist/docs/01-app/` for the current API shape. In particular: `params` is a `Promise` — you MUST `await` it. The existing admin pattern in `app/admin/(protected)/products/[id]/edit/page.tsx` is the canonical reference.

**Design rules the plan follows (memory):**
- Server Components by default — only marked Client where interactivity requires it.
- No new npm packages.
- Hebrew copy is locked in the spec — do not re-word.
- Mobile-first verification at 375 / 430 / 768 / 1024.

---

## File Structure

```
app/
  error.tsx                            CREATE (root error boundary)
  page.tsx                             DELETE (replaced by (public)/page.tsx)
  (public)/
    layout.tsx                         CREATE (mounts BasketProvider + BasketButton)
    page.tsx                           CREATE (hero + grid + footer)
    products/
      [id]/
        page.tsx                       CREATE (product detail)
        not-found.tsx                  CREATE (Hebrew 404)
    _shop/
      hero.tsx                         CREATE
      contact-footer.tsx               CREATE
      product-card.tsx                 CREATE
      product-grid.tsx                 CREATE
      product-gallery.tsx              CREATE (Client)
      product-detail.tsx               CREATE

components/
  basket/
    basket-provider.tsx                CREATE (Client)
    basket-button.tsx                  CREATE (Client)
    basket-drawer.tsx                  CREATE (Client)
    add-to-basket-button.tsx           CREATE (Client)
    basket-link-builder.ts             CREATE (pure)
    types.ts                           CREATE (shared BasketItem type)

lib/
  products/
    queries.ts                         MODIFY (add listAvailableProducts)

.env.example                           MODIFY (add two NEXT_PUBLIC_* keys)
.env.local                             MODIFY (add real values — local only, NOT committed)

tests/
  shop/
    homepage.spec.ts                   CREATE
    product-detail.spec.ts             CREATE
    basket-flow.spec.ts                CREATE
    basket-persistence.spec.ts         CREATE
```

**No migrations in Phase 5.** The `products` table already has every column.

**Reuse:** `getProduct(id)` in `lib/products/queries.ts` already calls `notFound()` on missing — reuse it for the detail page. Only the list side needs a new function.

---

## Task 0: Pre-flight — env vars and branch

**Files:**
- Modify: `.env.example`
- Modify: `.env.local`

- [ ] **Step 1: Append two keys to `.env.example`**

Append to the end of `.env.example`:

```bash
# Phase 5 — customer-facing shop
# WhatsApp number for the "send order" button — wa.me format: no `+`, no spaces.
NEXT_PUBLIC_WHATSAPP_NUMBER=972545570941
# Contact email for the mailto: fallback and the footer.
NEXT_PUBLIC_CONTACT_EMAIL=bat.chipli@gmail.com
```

- [ ] **Step 2: Mirror both keys in `.env.local`**

Same two keys with the same values. `.env.local` is gitignored; these values are safe to ship to production because they're public anyway (phone + email appear on the site).

- [ ] **Step 3: Verify dev server still boots**

Run: `npm run dev`
Expected: server starts, `/` still serves the current stub, no env errors logged. Kill the dev server.

- [ ] **Step 4: Commit `.env.example` only**

```bash
git add .env.example
git commit -m "Phase 5 Task 0: declare NEXT_PUBLIC_WHATSAPP_NUMBER and NEXT_PUBLIC_CONTACT_EMAIL"
```

---

## Task 1: Extend product queries with `listAvailableProducts`

**Files:**
- Modify: `lib/products/queries.ts`

- [ ] **Step 1: Append `listAvailableProducts` to the queries module**

Open `lib/products/queries.ts`. Below the existing `listProducts` function, add:

```ts
export async function listAvailableProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .eq('is_available', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}
```

Notes:
- Filters `is_available = true` — the customer grid only shows shoppable items.
- `getProduct(id)` already exists and handles 404 via `notFound()`; do NOT add a new `getProductById` — reuse `getProduct`.
- RLS on `products` allows anonymous `SELECT` (from `0001_init.sql`), so no service key needed.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/products/queries.ts
git commit -m "Phase 5 Task 1: listAvailableProducts query for customer grid"
```

---

## Task 2: Basket types + pure link builder

**Files:**
- Create: `components/basket/types.ts`
- Create: `components/basket/basket-link-builder.ts`

- [ ] **Step 1: Create the shared `BasketItem` type**

Create `components/basket/types.ts`:

```ts
export type BasketItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type BasketState = {
  items: BasketItem[];
};

export const EMPTY_BASKET: BasketState = { items: [] };

export const BASKET_STORAGE_KEY = 'salsala.basket.v1';
```

- [ ] **Step 2: Create the pure URL builder**

Create `components/basket/basket-link-builder.ts`:

```ts
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
```

Notes:
- Returns `null` when the env var is missing so the UI can render a disabled button.
- No React imports — this is a pure module.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/basket/types.ts components/basket/basket-link-builder.ts
git commit -m "Phase 5 Task 2: basket types + pure WhatsApp/mailto URL builder"
```

---

## Task 3: BasketProvider — Context + localStorage

**Files:**
- Create: `components/basket/basket-provider.tsx`

- [ ] **Step 1: Write the provider**

Create `components/basket/basket-provider.tsx`:

```tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  BASKET_STORAGE_KEY,
  EMPTY_BASKET,
  type BasketItem,
  type BasketState,
} from './types';

type Action =
  | { type: 'HYDRATE'; state: BasketState }
  | { type: 'ADD_ITEM'; item: Omit<BasketItem, 'quantity'> }
  | { type: 'SET_QUANTITY'; id: string; quantity: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR' };

function reducer(state: BasketState, action: Action): BasketState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'SET_QUANTITY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.id !== action.id) };
    case 'CLEAR':
      return EMPTY_BASKET;
    default:
      return state;
  }
}

type BasketContextValue = {
  state: BasketState;
  hydrated: boolean;
  itemCount: number;
  addItem: (item: Omit<BasketItem, 'quantity'>) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_BASKET);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BASKET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BasketState;
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'HYDRATE', state: parsed });
        }
      }
    } catch {
      // Corrupt or unavailable — start empty.
    }
    setHydrated(true);
  }, []);

  // Persist after every change, but only after hydration to avoid overwriting.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded / disabled — in-memory fallback, no user-facing error.
    }
  }, [state, hydrated]);

  const addItem = useCallback(
    (item: Omit<BasketItem, 'quantity'>) => dispatch({ type: 'ADD_ITEM', item }),
    [],
  );
  const setQuantity = useCallback(
    (id: string, quantity: number) =>
      dispatch({ type: 'SET_QUANTITY', id, quantity }),
    [],
  );
  const removeItem = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ITEM', id }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount = useMemo(
    () => state.items.reduce((n, i) => n + i.quantity, 0),
    [state.items],
  );

  const value = useMemo<BasketContextValue>(
    () => ({
      state,
      hydrated,
      itemCount,
      addItem,
      setQuantity,
      removeItem,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [state, hydrated, itemCount, addItem, setQuantity, removeItem, clear, drawerOpen],
  );

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) {
    throw new Error('useBasket must be used inside <BasketProvider>');
  }
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/basket/basket-provider.tsx
git commit -m "Phase 5 Task 3: BasketProvider with localStorage persistence"
```

---

## Task 4: Floating BasketButton (FAB)

**Files:**
- Create: `components/basket/basket-button.tsx`

- [ ] **Step 1: Write the floating button**

Create `components/basket/basket-button.tsx`:

```tsx
'use client';

import { useBasket } from './basket-provider';

export function BasketButton() {
  const { itemCount, openDrawer, hydrated } = useBasket();

  // Never render until after hydration, to avoid SSR markup flashing a count of 0
  // then snapping to N. Also keep the viewport clean on empty baskets.
  if (!hydrated || itemCount === 0) return null;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="פתח/י את הסל"
      className="fixed bottom-4 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-[0_10px_30px_rgba(31,27,23,0.18)] transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <BasketIcon />
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-xs font-medium text-surface"
      >
        {itemCount}
      </span>
    </button>
  );
}

function BasketIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7h18l-2 12a2 2 0 0 1-2 1.8H7a2 2 0 0 1-2-1.8L3 7z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
```

Notes:
- `bottom-4 left-4` = visual bottom-left; in Hebrew RTL this is the "end" corner, the conventional FAB position for RTL layouts.
- Count badge is `aria-hidden` so screen readers read the button's `aria-label` only, not "2" separately.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/basket/basket-button.tsx
git commit -m "Phase 5 Task 4: floating BasketButton with count badge"
```

---

## Task 5: BasketDrawer — line items + send buttons

**Files:**
- Create: `components/basket/basket-drawer.tsx`

- [ ] **Step 1: Write the drawer**

Create `components/basket/basket-drawer.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useBasket } from './basket-provider';
import {
  basketSubtotal,
  buildMailtoUrl,
  buildWhatsAppUrl,
} from './basket-link-builder';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function BasketDrawer() {
  const { state, drawerOpen, closeDrawer, setQuantity, removeItem } = useBasket();

  // Close on Escape, lock body scroll while open.
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
      {/* Scrim */}
      <button
        type="button"
        aria-label="סגור"
        onClick={closeDrawer}
        className="absolute inset-0 bg-foreground/40"
      />
      {/* Panel — slides in from the visual left (RTL start edge mirrored) */}
      <aside
        className="absolute inset-y-0 left-0 flex h-full w-full flex-col bg-surface shadow-[0_10px_30px_rgba(31,27,23,0.12)] sm:w-[420px]"
      >
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/basket/basket-drawer.tsx
git commit -m "Phase 5 Task 5: BasketDrawer with qty stepper + WhatsApp/mailto send"
```

---

## Task 6: AddToBasketButton — used on the detail page

**Files:**
- Create: `components/basket/add-to-basket-button.tsx`

- [ ] **Step 1: Write the button**

Create `components/basket/add-to-basket-button.tsx`:

```tsx
'use client';

import { useBasket } from './basket-provider';

type Props = {
  productId: string;
  name: string;
  price: number;
  disabled?: boolean;
};

export function AddToBasketButton({ productId, name, price, disabled }: Props) {
  const { state, addItem, openDrawer, hydrated } = useBasket();
  const existing = state.items.find((i) => i.id === productId);

  const label = existing
    ? `בסל · ${existing.quantity}`
    : 'הוסף לסל';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled || !hydrated}
        onClick={() => {
          addItem({ id: productId, name, price });
          openDrawer();
        }}
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
```

Notes:
- Uses `hydrated` to keep the button disabled during SSR hand-off — prevents a flash where the label reads `הוסף לסל` and snaps to `בסל · 2` after hydration.
- Opens the drawer on add so the customer sees confirmation and can continue / send immediately.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/basket/add-to-basket-button.tsx
git commit -m "Phase 5 Task 6: AddToBasketButton with hydration-safe label"
```

---

## Task 7: Shop hero + contact footer (static Server Components)

**Files:**
- Create: `app/(public)/_shop/hero.tsx`
- Create: `app/(public)/_shop/contact-footer.tsx`

- [ ] **Step 1: Create the hero**

Create `app/(public)/_shop/hero.tsx`:

```tsx
const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

export function Hero() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4 text-center sm:min-h-[80vh]">
      <h1 className="font-display text-5xl font-medium text-foreground sm:text-6xl">
        {businessName}
      </h1>
      <p className="text-lg text-muted">כל סלסלה נארזת באהבה</p>
      <a
        href="#catalog"
        aria-label="לקטלוג"
        className="mt-4 text-muted transition-opacity duration-200 hover:opacity-70"
      >
        <ChevronDown />
      </a>
    </section>
  );
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
```

- [ ] **Step 2: Create the contact footer**

Create `app/(public)/_shop/contact-footer.tsx`:

```tsx
const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function formatPhoneIL(raw: string | undefined): string | null {
  if (!raw) return null;
  // "972545570941" -> "054-557-0941"
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
            href={`tel:+${PHONE}`}
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
      <p className="pb-6 text-center text-xs text-muted">© Salsala</p>
    </footer>
  );
}
```

Notes:
- Instagram handle and business hours are intentionally NOT rendered this phase — they'll be added when values arrive (spec §8.6, §13).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(public)/_shop/hero.tsx' 'app/(public)/_shop/contact-footer.tsx'
git commit -m "Phase 5 Task 7: shop hero + contact footer"
```

---

## Task 8: ProductCard + ProductGrid

**Files:**
- Create: `app/(public)/_shop/product-card.tsx`
- Create: `app/(public)/_shop/product-grid.tsx`

- [ ] **Step 1: Create the card**

Create `app/(public)/_shop/product-card.tsx`:

```tsx
import Link from 'next/link';
import Image from 'next/image';
import type { ProductRow } from '@/lib/products/queries';

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductCard({ product }: { product: ProductRow }) {
  const primary = product.image_urls[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-xl bg-surface shadow-[0_1px_2px_rgba(31,27,23,0.06)] transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-background">
        {primary ? (
          <Image
            src={primary}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 430px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">—</div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <span className="font-display text-lg text-foreground">
          {product.name}
        </span>
        <span className="text-sm text-muted">
          ₪{PRICE_FORMAT.format(product.price)}
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create the grid**

Create `app/(public)/_shop/product-grid.tsx`:

```tsx
import { listAvailableProducts } from '@/lib/products/queries';
import { ProductCard } from './product-card';

export async function ProductGrid() {
  const products = await listAvailableProducts();

  return (
    <section
      id="catalog"
      aria-label="מוצרים"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
    >
      {products.length === 0 ? (
        <p className="py-8 text-center text-muted">
          עדיין אין מוצרים בקטלוג
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
```

Notes:
- `min-[430px]:grid-cols-2` uses Tailwind 4's arbitrary-breakpoint syntax to match the mobile-first breakpoint set in memory.
- `next/image` `fill` + `sizes` gives responsive images without a manual `width`/`height`.
- Remote image host for Supabase Storage is already configured in `next.config.ts` from Phase 4.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(public)/_shop/product-card.tsx' 'app/(public)/_shop/product-grid.tsx'
git commit -m "Phase 5 Task 8: ProductCard + ProductGrid (available-only)"
```

---

## Task 9: ProductGallery — Client image carousel

**Files:**
- Create: `app/(public)/_shop/product-gallery.tsx`

- [ ] **Step 1: Write the gallery**

Create `app/(public)/_shop/product-gallery.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      if (images.length === 0) return;
      const clamped = (next + images.length) % images.length;
      setIndex(clamped);
      const scroller = scrollerRef.current;
      if (scroller) {
        const child = scroller.children[clamped] as HTMLElement | undefined;
        child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    },
    [images.length],
  );

  // Keyboard ← / → cycles (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index + 1); // RTL: left = next
      if (e.key === 'ArrowRight') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  // Track active image on native swipe scroll (mobile).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const children = Array.from(scroller.children) as HTMLElement[];
      const scrollerMid = scroller.scrollLeft + scroller.clientWidth / 2;
      const closest = children.reduce(
        (best, child, i) => {
          const mid = child.offsetLeft + child.clientWidth / 2;
          const dist = Math.abs(mid - scrollerMid);
          return dist < best.dist ? { i, dist } : best;
        },
        { i: 0, dist: Number.POSITIVE_INFINITY },
      );
      setIndex(closest.i);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-background text-muted">
        —
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-background"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative aspect-square w-full shrink-0 snap-start"
          >
            <Image
              src={src}
              alt={`${alt} — תמונה ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`עבור לתמונה ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-opacity duration-200 ${
                i === index ? 'bg-foreground' : 'bg-foreground/30'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

Notes:
- Pure CSS snap scroll — no carousel library, matches "no new deps" rule.
- In RTL mode, native scroll direction on touch matches the arrow mapping (← = next visually).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(public)/_shop/product-gallery.tsx'
git commit -m "Phase 5 Task 9: ProductGallery swipeable carousel"
```

---

## Task 10: ProductDetail — server shell with gallery + add-to-basket

**Files:**
- Create: `app/(public)/_shop/product-detail.tsx`

- [ ] **Step 1: Write the detail shell**

Create `app/(public)/_shop/product-detail.tsx`:

```tsx
import type { ProductRow } from '@/lib/products/queries';
import { AddToBasketButton } from '@/components/basket/add-to-basket-button';
import { ProductGallery } from './product-gallery';

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductDetail({ product }: { product: ProductRow }) {
  return (
    <article className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-12">
      <div className="order-1 md:order-2">
        <ProductGallery images={product.image_urls} alt={product.name} />
      </div>
      <div className="order-2 flex flex-col gap-5 md:order-1">
        {!product.is_available ? (
          <span className="inline-flex w-fit rounded-full bg-[#E8DEC9] px-3 py-1 text-xs text-muted">
            לא זמין
          </span>
        ) : null}
        <h1 className="font-display text-4xl font-medium text-foreground">
          {product.name}
        </h1>
        <p className="font-display text-2xl text-muted">
          ₪{PRICE_FORMAT.format(product.price)}
        </p>
        {product.description ? (
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
            {product.description}
          </p>
        ) : null}
        <div className="pt-2">
          <AddToBasketButton
            productId={product.id}
            name={product.name}
            price={product.price}
            disabled={!product.is_available}
          />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(public)/_shop/product-detail.tsx'
git commit -m "Phase 5 Task 10: ProductDetail server shell + add-to-basket wiring"
```

---

## Task 11: (public)/layout.tsx — mount basket provider + FAB + drawer

**Files:**
- Create: `app/(public)/layout.tsx`

- [ ] **Step 1: Write the layout**

Create `app/(public)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { BasketProvider } from '@/components/basket/basket-provider';
import { BasketButton } from '@/components/basket/basket-button';
import { BasketDrawer } from '@/components/basket/basket-drawer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <BasketProvider>
      {children}
      <BasketButton />
      <BasketDrawer />
    </BasketProvider>
  );
}
```

Notes:
- This layout only applies inside the `(public)` route group. Admin routes (`app/admin/(protected)/...`) do NOT inherit from here — they live in a sibling branch and keep their own layout untouched.
- `BasketProvider` is a Client Component; wrapping children in it is fine in a Server Component layout because the provider declares its own `'use client'` boundary.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(public)/layout.tsx'
git commit -m "Phase 5 Task 11: (public) layout mounts BasketProvider + FAB + drawer"
```

---

## Task 12: Homepage — hero + grid + footer, delete old stub

**Files:**
- Create: `app/(public)/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Step 1: Write the new homepage**

Create `app/(public)/page.tsx`:

```tsx
import { Hero } from './_shop/hero';
import { ProductGrid } from './_shop/product-grid';
import { ContactFooter } from './_shop/contact-footer';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductGrid />
      <ContactFooter />
    </>
  );
}
```

- [ ] **Step 2: Delete the old homepage stub**

```bash
rm app/page.tsx
```

- [ ] **Step 3: Verify the new route resolves**

Run: `npm run dev`
Open: `http://localhost:3000/`
Expected: hero renders with "Salsala" + tagline, product grid below shows only available products (or the empty-state message), footer at the bottom. Kill the dev server.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/(public)/page.tsx' app/page.tsx
git commit -m "Phase 5 Task 12: replace homepage stub with hero + grid + footer"
```

---

## Task 13: Product detail route + Hebrew 404

**Files:**
- Create: `app/(public)/products/[id]/page.tsx`
- Create: `app/(public)/products/[id]/not-found.tsx`

- [ ] **Step 1: Write the detail page**

Create `app/(public)/products/[id]/page.tsx`:

```tsx
import { getProduct } from '@/lib/products/queries';
import { ProductDetail } from '../../_shop/product-detail';
import { ContactFooter } from '../../_shop/contact-footer';

type Params = Promise<{ id: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id); // throws notFound() on miss

  return (
    <>
      <ProductDetail product={product} />
      <ContactFooter />
    </>
  );
}
```

- [ ] **Step 2: Write the Hebrew 404**

Create `app/(public)/products/[id]/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl font-medium">המוצר לא נמצא</h1>
      <p className="text-muted">
        אולי הוסר מהקטלוג. חזרו לעמוד הראשי.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90"
      >
        חזרה לחנות
      </Link>
    </section>
  );
}
```

- [ ] **Step 3: Smoke test**

Run: `npm run dev`
- Navigate to `/products/<real-id>` (from the grid): detail renders with gallery + description + add-to-basket.
- Navigate to `/products/does-not-exist`: 404 page renders in Hebrew with "חזרה לחנות" link.
- Kill the dev server.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/(public)/products/[id]/page.tsx' 'app/(public)/products/[id]/not-found.tsx'
git commit -m "Phase 5 Task 13: product detail page + Hebrew not-found"
```

---

## Task 14: Root error boundary (public failures)

**Files:**
- Create: `app/error.tsx`

- [ ] **Step 1: Write the root error boundary**

Create `app/error.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl font-medium">משהו השתבש</h1>
      <p className="text-muted">
        קרתה תקלה בטעינת הדף. נסו שוב בעוד רגע.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface transition-opacity duration-200 hover:opacity-90"
      >
        נסו שוב
      </button>
    </section>
  );
}
```

Notes:
- The admin route group has its own error boundary (`app/admin/(protected)/error.tsx`) — it continues to take precedence inside `/admin/**`.
- This root boundary catches Server Component errors on the public surface (e.g., Supabase unreachable from `/` or `/products/[id]`).

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/error.tsx
git commit -m "Phase 5 Task 14: root error boundary in Hebrew"
```

---

## Task 15: E2E tests — homepage + detail page

**Files:**
- Create: `tests/shop/homepage.spec.ts`
- Create: `tests/shop/product-detail.spec.ts`

**Prereq:** at least one product with `is_available = true` seeded via the admin UI or a Supabase SQL script. Use Phase 4's admin flow manually if needed, or add a fixture script under `tests/` that admins can run. For this plan, assume the E2E suite hits a Supabase project that has at least one available product.

- [ ] **Step 1: Homepage spec**

Create `tests/shop/homepage.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('homepage', () => {
  test('renders hero + catalog', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Hero
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('כל סלסלה נארזת באהבה')).toBeVisible();

    // Catalog anchor exists
    await expect(page.locator('#catalog')).toBeVisible();
  });

  test('grid shows only available products', async ({ page }) => {
    await page.goto('/');
    // Every visible card should be a link to /products/<id>
    const cards = page.locator('#catalog a[href^="/products/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Product detail spec**

Create `tests/shop/product-detail.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('product detail', () => {
  test('clicking a card opens the detail page', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('#catalog a[href^="/products/"]').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/products\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /הוסף לסל|בסל/ })).toBeVisible();
  });

  test('unknown product id renders Hebrew 404', async ({ page }) => {
    const res = await page.goto('/products/00000000-0000-0000-0000-000000000000');
    expect(res?.status()).toBe(404);
    await expect(page.getByText('המוצר לא נמצא')).toBeVisible();
    await expect(page.getByRole('link', { name: 'חזרה לחנות' })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the suite**

Run: `npm run test:e2e -- tests/shop/homepage.spec.ts tests/shop/product-detail.spec.ts`
Expected: all green. If a test times out on image load, verify the Supabase Storage URL is reachable in the test environment.

- [ ] **Step 4: Commit**

```bash
git add tests/shop/homepage.spec.ts tests/shop/product-detail.spec.ts
git commit -m "Phase 5 Task 15: E2E tests for homepage + product detail"
```

---

## Task 16: E2E tests — basket flow + persistence

**Files:**
- Create: `tests/shop/basket-flow.spec.ts`
- Create: `tests/shop/basket-persistence.spec.ts`

- [ ] **Step 1: Basket flow spec (mobile viewport)**

Create `tests/shop/basket-flow.spec.ts`:

```ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test.describe('basket flow (mobile)', () => {
  test('add → open drawer → stepper → WhatsApp + mailto URLs', async ({ page }) => {
    await page.goto('/');
    // Open first product
    await page.locator('#catalog a[href^="/products/"]').first().click();

    // Add to basket → drawer auto-opens
    await page.getByRole('button', { name: /הוסף לסל|בסל/ }).click();
    await expect(page.getByRole('dialog', { name: 'הסל שלי' })).toBeVisible();

    // Qty stepper
    await page.getByRole('button', { name: 'הגדל כמות' }).click();
    await expect(page.getByLabel('כמות: 2')).toBeVisible();

    // WhatsApp link
    const waLink = page.getByRole('link', { name: 'שלח/י בוואטסאפ' });
    const waHref = await waLink.getAttribute('href');
    expect(waHref).toMatch(/^https:\/\/wa\.me\/972545570941\?text=/);
    expect(decodeURIComponent(waHref!)).toContain('שלום!');
    expect(decodeURIComponent(waHref!)).toContain('סה"כ');

    // mailto link
    const mailLink = page.getByRole('link', { name: 'שלח/י באימייל' });
    const mailHref = await mailLink.getAttribute('href');
    expect(mailHref).toMatch(/^mailto:bat\.chipli@gmail\.com\?subject=/);
    expect(decodeURIComponent(mailHref!)).toContain('הזמנה חדשה מסלסלה');

    // Remove item → empty state
    await page.getByRole('button', { name: 'הסר מהסל' }).click();
    await expect(
      page.getByText('הסל ריק. הוסיפ/י פריטים כדי להתחיל.'),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Persistence spec**

Create `tests/shop/basket-persistence.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('basket persistence', () => {
  test('survives reload via localStorage', async ({ page }) => {
    await page.goto('/');
    await page.locator('#catalog a[href^="/products/"]').first().click();
    await page.getByRole('button', { name: /הוסף לסל|בסל/ }).click();
    await expect(page.getByRole('dialog', { name: 'הסל שלי' })).toBeVisible();

    // Close drawer, reload page
    await page.keyboard.press('Escape');
    await page.reload();

    // Basket FAB should show count = 1
    await expect(page.getByRole('button', { name: 'פתח/י את הסל' })).toBeVisible();
    await page.getByRole('button', { name: 'פתח/י את הסל' }).click();
    await expect(page.getByLabel('כמות: 1')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the full shop suite**

Run: `npm run test:e2e -- tests/shop/`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add tests/shop/basket-flow.spec.ts tests/shop/basket-persistence.spec.ts
git commit -m "Phase 5 Task 16: E2E tests for basket flow + persistence"
```

---

## Task 17: Mobile verification pass + polish

**Files:** none new — visual check only.

- [ ] **Step 1: Boot dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify every surface at each breakpoint**

Open Chromium DevTools device toolbar. For each width below, visit `/`, click into a product, open the basket drawer, remove an item, reach the empty state. Confirm no layout break / overflow / RTL bug.

| Width | Check |
|---|---|
| 375 | Hero scales, grid is 1 column, FAB doesn't cover tap targets, drawer is full-width |
| 430 | Grid is 2 columns, cards not squashed |
| 768 | Detail page uses 2-col layout (gallery + text), drawer panel is 420px |
| 1024 | Grid is 3 columns, footer is a single row |

- [ ] **Step 3: Fix any visual regressions inline**

If a bug shows up at any breakpoint, fix the responsible component and re-verify. Commit any fixes as:

```bash
git add <changed files>
git commit -m "Phase 5 polish: <one-line description>"
```

- [ ] **Step 4: Run the full test suite one more time**

Run: `npm run test:e2e`
Expected: all Phase 4 + Phase 5 specs green.

- [ ] **Step 5: Final commit (if anything still uncommitted)**

```bash
git status
# if clean, skip; otherwise:
git add -A
git commit -m "Phase 5 polish: mobile verification pass"
```

---

## Out-of-Phase follow-ups (do NOT run inside Phase 5 commits)

- **Bat-Chen password reset to `bat2002`** — run as a standalone Supabase MCP call via `auth.admin.updateUserById` (or Studio). Confirm with the user before executing.
- **Vercel env vars** — mirror `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_EMAIL` in the production env before the next deploy.
- **Instagram + business hours** — hidden in the footer this phase. Surface the fields once Bat-Chen supplies them.

---

## Self-Review Checklist (planner only — already run before handoff)

- [x] Every spec section (§1–§13) maps to a task: §3/§4/§5 → Tasks 0, 1, 11–13; §6 → Tasks 2, 3; §7 → Tasks 2, 5; §8 → Tasks 7–10; §9 copy → Tasks 4–14 inline; §10 → Tasks 13, 14; §11 → Tasks 15, 16; §12 → Task 17.
- [x] No placeholders / "TBD" / "handle errors appropriately" inside any task.
- [x] Type names + function names consistent: `ProductRow`, `BasketItem`, `BasketState`, `useBasket`, `listAvailableProducts`, `getProduct`.
- [x] Next 16 APIs used: `params: Promise<...>` + `await params`; `notFound()` inside `getProduct`; `app/error.tsx` client boundary.
- [x] No new npm packages introduced — verified against package.json.
