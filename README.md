# Salsala — Hebrew-RTL Boutique Ordering App

A customer-facing storefront + admin catalog for a small boutique (Shlomi & Bat-Chen, Yavne). Customers browse products, fill a basket, and send the order to the owner via WhatsApp or email — no payments, no checkout friction.

**Live:** [basket-salsala-934kc2ptw-ben-gutmans-projects.vercel.app](https://basket-salsala-934kc2ptw-ben-gutmans-projects.vercel.app)

---

## Stack

- **Next.js 16.2.4** (App Router, Turbopack, React 19, Server Components by default)
- **Supabase** — Postgres + Auth + Storage, Frankfurt region (`eu-central-1`)
- **Tailwind 4** + a custom design system in `design-system/salsala/MASTER.md`
- **Zod 4** for admin form validation
- **Playwright** for E2E tests
- **Vercel** for deploy (auto from `master`)

No state-management library, no CSS-in-JS, no component library — just native React + Tailwind.

---

## Project layout

```
app/
  (public)/                          Customer-facing surface (home + product detail)
    layout.tsx                       Mounts BasketProvider + floating basket button
    page.tsx                         Hero + product grid + footer
    products/[id]/page.tsx           Product detail with gallery
    _shop/                           Co-located shop components
  admin/
    login/                           Auto-redirects logged-in users to /admin
    (protected)/                     Auth-gated admin CRUD
  error.tsx                          Root Hebrew error boundary

components/
  basket/                            Client Context + localStorage + send-URL builder
  ui/                                Design-system primitives (button, card, input, modal…)

lib/
  products/queries.ts                Server-only queries (list, listAvailable, getProduct)
  products/schema.ts                 Zod admin-form schema
  products/storage.ts                Supabase Storage helpers
  supabase/                          SSR + browser clients + session-refresh proxy

supabase/migrations/                 Applied Postgres migrations (0001, 0002)
docs/superpowers/                    Per-phase specs + implementation plans
design-system/salsala/MASTER.md      Single source of truth for visuals

tests/e2e/                           Playwright specs (admin flow + shop flow)
```

---

## Local setup

```bash
# Install
npm install

# Copy envs and fill real values
cp .env.example .env.local

# Dev server
npm run dev          # http://localhost:3000
```

### Required env vars

All `NEXT_PUBLIC_*` because they're read by both Server and Client Components and their values are public-by-nature:

| Key | Example | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | SSR + browser clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` | SSR + browser clients |
| `NEXT_PUBLIC_BUSINESS_NAME` | `Salsala` | Hero wordmark + header |
| `NEXT_PUBLIC_OWNER_EMAIL` | `bat.chipli@gmail.com` | `mailto:` handoff + footer |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `972545570941` | `wa.me/` handoff + footer |

E2E-only:

| Key | Purpose |
|---|---|
| `E2E_ADMIN_EMAIL` | Admin user used by Playwright login helper |
| `E2E_ADMIN_PASSWORD` | Password for that user |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Run full Playwright suite (admin + shop, mobile + desktop) |
| `npm run test:e2e:headed` | Same, but with browsers visible |

`npx tsc --noEmit` for typecheck.

---

## Deployment

Connected to Vercel via GitHub. **Any push to `master` auto-deploys to production.**

To set/update env vars:
```bash
vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production   # (then paste value)
vercel env ls                                            # verify
vercel --prod                                            # trigger redeploy
```

---

## Data model

`public.products` (from `supabase/migrations/0001_init.sql` + `0002_product_images.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | client-generated at create time |
| `name` | `text` not null | |
| `price` | `numeric(10,2)` not null | two-decimals enforced by DB |
| `description` | `text` nullable | `whitespace-pre-line` in UI |
| `image_urls` | `text[]` not null default `{}` | index 0 = primary; max 5 (DB check) |
| `is_available` | `boolean` not null default `true` | grid filters on this |
| `display_order` | `int` not null | admin arrows reorder via `swap_display_order` RPC |
| `created_at` | `timestamptz` | |

RLS: public `SELECT`, authenticated `INSERT / UPDATE / DELETE`. Storage bucket: `product-images` (public).

---

## Routing quick reference

| Path | What |
|---|---|
| `/` | Customer homepage — hero + product grid + footer |
| `/products/[id]` | Customer product detail — gallery + description + add-to-basket |
| `/admin/login` | Admin sign-in (auto-redirects to `/admin` if already signed in) |
| `/admin` | Admin product list with inline toggle + reorder |
| `/admin/products/new` | New product form |
| `/admin/products/[id]/edit` | Edit + delete |

Discreet `ניהול` (admin) link lives in the public footer for the owner's bookmark-friendly workflow.

---

## Customer order flow (no payments)

1. Customer browses `/` → clicks a product → `/products/[id]`.
2. Clicks **הוסף לסל** → basket drawer slides in from the right.
3. Adjusts quantities in the drawer → clicks **שלח/י בוואטסאפ** or **שלח/י באימייל**.
4. Opens WhatsApp (or mail client) pre-filled with line items + subtotal.
5. Owner receives a normal WhatsApp/email message and coordinates pickup in Yavne.

The basket is `localStorage`-persisted (`salsala.basket.v1`) — device-scoped, no auth needed.

---

## Planning docs

Every phase has its own spec + plan under `docs/superpowers/`:

- Phase 1 — Hebrew RTL scaffolding + Supabase clients + session proxy
- Phase 2 — `products` schema + admin auth
- Phase 3 — Design tokens + UI primitives + editorial blue/white skin
- Phase 4 — Admin product CRUD (`docs/superpowers/specs/2026-04-17-phase-4-admin-crud-design.md` + `docs/superpowers/plans/2026-04-17-phase-4-admin-crud.md`)
- Phase 5 — Customer-facing shop (`docs/superpowers/specs/2026-04-17-phase-5-customer-shop-design.md` + `docs/superpowers/plans/2026-04-17-phase-5-customer-shop.md`)

---

## For the owner (Hebrew)

See `docs/owner-guide-he.html` — a printable Hebrew-RTL guide explaining how to log in, add/edit products, and receive orders. Open it in a browser and use **File → Print → Save as PDF** to share.
