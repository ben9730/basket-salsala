# Phase 5 — Customer-Facing Shop (design spec)

**Date:** 2026-04-17
**Status:** Approved (brainstorming)
**Stack:** Next.js 16 (App Router, Server Components), Supabase (Postgres public SELECT), Tailwind + existing design system
**Scope:** Public storefront with product grid, product detail pages, a client-side basket, and a WhatsApp + email handoff. No payments, no order records.

---

## 1. Goals

Turn the homepage stub into a real boutique storefront for Bat-Chen's customers:

- Browse every available product in a single grid from `/`.
- Open a dedicated detail page (`/products/[id]`) with a swipeable image gallery — URL is shareable on WhatsApp.
- Add items to a basket (persisted locally) and send the basket to Bat-Chen as a pre-filled WhatsApp message or email (customer chooses).
- Stay Hebrew-RTL, mobile-first, Server-Components-by-default, no new npm dependencies.

## 2. Non-goals (deferred)

- Online payments / checkout / order rows in Supabase.
- Customer accounts or baskets that persist across devices.
- Categories, tags, search, pagination — catalog is dozens of items.
- Shipping logic — handoff is "contact Bat-Chen, arrange pickup in Yavne."
- OG images and rich social previews — later polish phase.
- Transactional email services (Resend, SendGrid) — `mailto:` is the Phase 5 fallback.
- Drag-to-reorder, filters, favourites, reviews, related products.
- Admin-visible surface for this phase — no admin routes change.

## 3. Scope — routes

| Route | Kind | Purpose |
|---|---|---|
| `/` | Server Component | Hero + full product grid + contact footer |
| `/products/[id]` | Server Component | Product detail with gallery, description, add-to-basket |
| `/products/[id]` 404 path | Server | `notFound()` → Hebrew not-found page |

No new API routes. No Server Actions (basket lives in the browser; handoff is a URL).

## 4. Architecture

Uses a `(public)` route group to mirror the existing `(protected)` admin pattern. The root `app/layout.tsx` stays unchanged — only the HTML shell and fonts. A new `app/(public)/layout.tsx` wraps the customer-facing routes and mounts the basket provider + FAB, so admin routes are untouched.

```
app/
  layout.tsx                           (existing — root HTML / fonts only, NOT modified)
  error.tsx                            NEW — root error boundary (Hebrew)
  (public)/                            NEW route group — customer surface
    layout.tsx                         NEW — mounts <BasketProvider/> + <BasketButton/>
    page.tsx                           NEW — hero + <ProductGrid/> + <ContactFooter/>
    products/
      [id]/
        page.tsx                       NEW — Server Component; calls getProductById()
        not-found.tsx                  NEW — Hebrew 404
    _shop/                             NEW co-located shop components
      hero.tsx                         Server — wordmark + tagline
      product-grid.tsx                 Server — reads listAvailableProducts(), maps to cards
      product-card.tsx                 Server — image + name + price + availability chip
      product-gallery.tsx              Client — swipeable carousel, keyboard + touch
      product-detail.tsx               Server shell with Client <AddToBasketButton/>
      contact-footer.tsx               Server — reads env vars

app/page.tsx                           DELETE — replaced by (public)/page.tsx

components/
  basket/
    basket-provider.tsx                Client — React Context + useReducer + localStorage sync
    basket-button.tsx                  Client — floating FAB with count badge
    basket-drawer.tsx                  Client — slide-in panel with line items + send buttons
    add-to-basket-button.tsx           Client — used inside product-detail.tsx
    basket-link-builder.ts             Pure — builds wa.me + mailto URLs (unit-testable)

lib/
  products/
    queries.ts                         EXTEND — add listAvailableProducts(), getProductById()
```

**Component rules:**

- Server Components fetch data. Client Components own only the basket state, gallery swipe, and add/remove handlers — per memory rule "Server Components by default."
- Basket provider + FAB are mounted in `(public)/layout.tsx`, NOT in root `layout.tsx`. Admin routes (outside the `(public)` group) never see basket UI or basket state.
- `basket-link-builder.ts` is a pure module with no React imports — testable without a DOM.

## 5. Data model

**No migration needed.** The existing `products` table already has every column the shop needs:

| Column | Source | Used for |
|---|---|---|
| `id uuid` | 0001_init | Detail route param, basket line id |
| `name text` | 0001_init | Card title, detail H1, basket line text |
| `price numeric(10,2)` | 0001_init | Card + detail + basket + message subtotal |
| `description text` | 0001_init | Detail body (preserved whitespace) |
| `image_urls text[]` | 0002_product_images | Card thumbnail (idx 0) + detail gallery |
| `is_available boolean` | 0001_init | Grid filter, detail chip |
| `display_order int` | 0001_init | Grid ordering |

RLS from `0001_init.sql` already allows anonymous `SELECT`.

New query functions in `lib/products/queries.ts`:

```ts
export async function listAvailableProducts(): Promise<Product[]> {
  // SELECT * FROM products WHERE is_available = true ORDER BY display_order ASC
}

export async function getProductById(id: string): Promise<Product | null> {
  // SELECT * FROM products WHERE id = $1
  // returns null on not-found for notFound() path
}
```

Both are public reads — no auth, no service-role key.

## 6. Basket state

**Shape:**

```ts
type BasketItem = {
  id: string;        // product id
  name: string;      // snapshotted at add-time
  price: number;     // snapshotted at add-time
  quantity: number;  // integer >= 1
};

type BasketState = {
  items: BasketItem[];
};
```

**Snapshotting rationale:** the customer sees the price they agreed to at add-time in the WhatsApp message. If Bat-Chen edits a product mid-session, the basket does not silently change under the customer.

**Persistence:**

- `localStorage` key `salsala.basket.v1` (versioned for future migrations).
- Hydrated on mount inside `BasketProvider` with a guard against SSR (`useEffect` — skip on first render).
- Writes are debounced? No — `localStorage.setItem` is synchronous and fast enough for small payloads.

**Reducer actions:**

| Action | Effect |
|---|---|
| `ADD_ITEM` | If id exists → quantity + 1; else append with qty 1 |
| `SET_QUANTITY` | If qty ≤ 0 → remove; else set |
| `REMOVE_ITEM` | Drop by id |
| `CLEAR` | Reset to `{ items: [] }` |
| `HYDRATE` | Replace state from localStorage |

## 7. WhatsApp + mailto handoff

### 7.1 Env vars (new)

| Var | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `972545570941` | No `+`, no spaces — `wa.me` format |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `bat.chipli@gmail.com` | Used for both `mailto:` and footer link |

Both are `NEXT_PUBLIC_*` because they render into client-rendered buttons. Both are public (they're printed on the site anyway). Added to `.env.example`.

### 7.2 Message template (locked Hebrew)

```
שלום! אני מעוניין/ת להזמין:

• {שם מוצר} × {כמות} — ₪{מחיר}
• {שם מוצר} × {כמות} — ₪{מחיר}

סה"כ: ₪{סכום כולל}

שמי: _____
```

- Subtotal formatted with `Intl.NumberFormat('he-IL', { minimumFractionDigits: 0 })` (no decimals unless price has them).
- Line items keep insertion order (first-added first).
- `שמי: _____` left blank intentionally — customer fills in WhatsApp / email client.

### 7.3 URL builders

```ts
// pure, no React, no DOM
export function buildWhatsAppUrl(items: BasketItem[], number: string): string {
  const body = buildMessageBody(items);
  return `https://wa.me/${number}?text=${encodeURIComponent(body)}`;
}

export function buildMailtoUrl(items: BasketItem[], email: string): string {
  const subject = 'הזמנה חדשה מסלסלה';
  const body = buildMessageBody(items);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
```

### 7.4 Missing-env fallback

If either env var is undefined at runtime:

- The corresponding button renders disabled.
- Helper text below the pair: `הגדרות יצירת קשר חסרות`.
- Nothing crashes; the rest of the basket remains usable (the customer just can't send yet).

## 8. UI inventory

**Breakpoints (mobile-first per memory):** 375 / 430 / 768 / 1024.

### 8.1 Hero (`app/_shop/hero.tsx`)

- Centered, 60vh mobile / 80vh desktop.
- Wordmark: `Salsala` (read from `NEXT_PUBLIC_BUSINESS_NAME`) in `Frank Ruhl Libre`, `text-5xl sm:text-6xl`, weight 500.
- Tagline below: `כל סלסלה נארזת באהבה` in `text-muted`, `text-lg`, weight 400.
- Small scroll cue below tagline (chevron-down icon) linking to `#catalog`.
- Background: `bg-background` (cream) — no hero image this phase.

### 8.2 Product grid (`app/_shop/product-grid.tsx`)

- Anchor id `catalog` for the hero scroll cue.
- 1 col at 375, 2 col at 430+, 2 col at 768, 3 col at 1024+.
- Gap: `gap-4 sm:gap-6`.
- Each card:
  - Square aspect ratio image (`aspect-square`), `object-cover`, primary image = `image_urls[0]`.
  - Product name below (display serif, `text-lg`, weight 400).
  - Price in muted sans (`text-sm text-muted`), formatted `₪{price}`.
  - Availability chip only if `!is_available` (so the default "available" state is clean).
  - Tapping anywhere on card → `<Link href="/products/[id]">`.
- Grid empty state: centered card with `עדיין אין מוצרים בקטלוג`.

### 8.3 Product detail (`app/products/[id]/page.tsx`)

Layout at 768+: gallery on right (RTL → visual left), text column on left (RTL → visual right).
Mobile: gallery top, text stacked below.

- Gallery (`product-gallery.tsx`, Client):
  - Swipe on touch (native `scroll-snap-type: x mandatory` — no lib).
  - Thumbs below on desktop, dots on mobile.
  - Keyboard ←/→ cycles on desktop.
- Name: display serif, `text-4xl`, weight 500.
- Price: display serif, `text-2xl`, weight 400, muted.
- `is_available=false` → chip `לא זמין` at top + add-to-basket button disabled.
- Description: preserves whitespace (`whitespace-pre-line`), `text-base leading-relaxed`.
- Add-to-basket button (`add-to-basket-button.tsx`, Client):
  - Default label: `הוסף לסל`.
  - If item already in basket: label becomes `בסל · {qty}` with inline `+` button.
  - On click → `ADD_ITEM` dispatch + subtle toast `נוסף לסל`.

### 8.4 Floating basket button (`components/basket/basket-button.tsx`)

- Fixed `bottom-4 left-4` — bottom-left of the viewport (RTL "end" corner, mirroring the LTR bottom-right FAB convention).
- 56×56 circle, `bg-primary` (`#8C4A1F`), white basket icon.
- Badge anchored to the icon's visual top-right: `bg-foreground`, white text, count of items (sum of quantities).
- Hidden when `items.length === 0`.
- Mounted only via `(public)/layout.tsx` — admin routes never render it.

### 8.5 Basket drawer (`components/basket/basket-drawer.tsx`)

- Slide-in from left (RTL).
- Width: 100% on mobile, 420px on desktop.
- Scrim: `bg-foreground/40`, click-to-close.
- Header: title `הסל שלי` + close X.
- Body: list of line items:
  - Thumb (40×40 rounded), name (truncate), price.
  - Qty stepper `−  {qty}  +` with trash icon when qty would drop to 0.
  - Line subtotal at end: `₪{qty × price}`.
- Footer:
  - Subtotal row: `סה"כ` … `₪{total}`.
  - Primary button: `שלח/י בוואטסאפ` (full width, `bg-primary`).
  - Secondary button: `שלח/י באימייל` (outline, full width).
  - If env vars missing → both disabled + helper text `הגדרות יצירת קשר חסרות`.
- Empty state: centered message `הסל ריק. הוסיפ/י פריטים כדי להתחיל.` + close button.

### 8.6 Contact footer (`app/_shop/contact-footer.tsx`)

- Single row at 768+, stacked at 375/430.
- Items:
  - `tel:972545570941` — label shows formatted Israeli number.
  - `mailto:bat.chipli@gmail.com` — label shows email.
  - City: `איסוף עצמי ביבנה` (text only, no link).
  - Instagram handle: **hidden this phase** (placeholder until value supplied).
  - Business hours: **hidden this phase** (placeholder until value supplied).
- Separator between items: `·` middot with `text-muted`.
- Very small copyright line below: `© Salsala`.

## 9. Hebrew vocabulary (locked)

| Purpose | Hebrew |
|---|---|
| Tagline | `כל סלסלה נארזת באהבה` |
| Scroll cue | `לקטלוג` |
| Catalog title (sr-only) | `מוצרים` |
| Available (chip, hidden by default) | `זמין` |
| Unavailable | `לא זמין` |
| Add to basket | `הוסף לסל` |
| In basket (with qty) | `בסל · {qty}` |
| Toast on add | `נוסף לסל` |
| Remove | `הסר` |
| My basket (drawer title) | `הסל שלי` |
| Close | `סגור` |
| Subtotal | `סה"כ` |
| Send via WhatsApp | `שלח/י בוואטסאפ` |
| Send via email | `שלח/י באימייל` |
| Email subject | `הזמנה חדשה מסלסלה` |
| Basket empty | `הסל ריק. הוסיפ/י פריטים כדי להתחיל.` |
| Catalog empty | `עדיין אין מוצרים בקטלוג` |
| Product not found title | `המוצר לא נמצא` |
| Product not found body | `אולי הוסר מהקטלוג. חזרו לעמוד הראשי.` |
| Back to shop | `חזרה לחנות` |
| Pickup area | `איסוף עצמי ביבנה` |
| Contact missing helper | `הגדרות יצירת קשר חסרות` |
| Page-level error title | `משהו השתבש` |
| Page-level error action | `נסו שוב` |
| Copyright | `© Salsala` |

All copy locked for Phase 5. Future phases can add keys; they cannot re-word these without a follow-up.

## 10. Error handling

| Surface | Failure | Response |
|---|---|---|
| `/` data fetch | Supabase unreachable | `app/error.tsx` renders Hebrew `משהו השתבש` + retry |
| `/products/[id]` | id not in DB | `notFound()` → `not-found.tsx` with Hebrew body + `חזרה לחנות` link |
| `/products/[id]` | DB error | Bubbles to `app/error.tsx` |
| Basket send | Env vars missing | Buttons disabled, helper text shown (non-crashing) |
| localStorage | Quota exceeded or disabled | `BasketProvider` catches, falls back to in-memory state, logs warning |

## 11. Testing (Playwright, E2E)

Matches Phase 4 rhythm (real Supabase, no mocks — per memory feedback):

| Spec | Asserts |
|---|---|
| `tests/shop/homepage.spec.ts` | Hero wordmark + tagline render; grid shows seeded products; unavailable products do not appear; dir=rtl on html |
| `tests/shop/product-detail.spec.ts` | Gallery cycles through images; keyboard ← → works on desktop; unknown id → 404 page with Hebrew copy |
| `tests/shop/basket-flow.spec.ts` (mobile viewport 375) | Add item → FAB shows count 1; open drawer → qty stepper +/− works; empty state appears after removing; `שלח/י בוואטסאפ` anchor href starts with `https://wa.me/972545570941?text=` and contains URL-encoded Hebrew body; `שלח/י באימייל` anchor href starts with `mailto:bat.chipli@gmail.com?subject=` |
| `tests/shop/basket-persistence.spec.ts` | Add → reload → basket still populated from localStorage |

Unit test for `basket-link-builder.ts` is **out of scope** — it is exercised end-to-end via the basket-flow spec, which matches the existing project's "E2E over unit" stance.

## 12. Rollout

- Single Phase 5 PR, matching Phase 4 atomic-commit rhythm (~8–10 task commits + polish commit).
- Verify every surface at 375 / 430 / 768 / 1024 before claiming done (memory rule).
- Ship `.env.local` values for `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_EMAIL` locally; add same keys to Vercel env before deploy.
- Bat-Chen's password reset to `bat2002` handled as a separate Supabase-MCP step (outside Phase 5 commits).

**Next.js 16 guardrail** (per `AGENTS.md`): before writing any route, error boundary, dynamic params, or Link/Image usage, consult `node_modules/next/dist/docs/` for the current Next 16 API shape. Do not rely on Next 15 muscle memory. In particular re-verify: route-group layouts, `notFound()` imports, `params` as Promise vs plain object in dynamic routes, `next/image` props.

## 13. Dependencies on future phases (parking lot)

- If customers complain that sent WhatsApp messages get lost, promote to Resend-backed server email (adds `resend` dep — needs approval).
- If catalog grows past ~40 products, add categories/filters (own phase).
- If Bat-Chen wants order history, introduce an `orders` table + capture at handoff (own phase, likely with auth on customer side).
