# Phase 4 — Admin Product CRUD (design spec)

**Date:** 2026-04-17
**Status:** Approved (brainstorming)
**Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres + Storage), Tailwind + existing design system
**Scope:** Admin-only CRUD for the `products` table, with 1 primary + up to 4 extra images per product, in-list reorder, and availability toggle. No customer-facing changes.

---

## 1. Goals

Let Bat-Chen (and Shlomi) manage the boutique catalog directly from `/admin`:

- See every product in one scrollable list with its primary image, price, availability state, and display order.
- Create, edit, and delete products.
- Upload between 1 and 5 images per product — first image is the primary thumbnail/hero, the rest are optional extras.
- Toggle availability without leaving the list.
- Reorder products via up/down arrow buttons.

## 2. Non-goals (deferred)

- Customer-facing shop page.
- Categories, tags, or product attributes beyond the existing columns.
- Bulk operations (CSV import/export, multi-select delete).
- Image cropping, reordering of extras inside a single product (for this phase, extras keep insertion order).
- Pagination or search on the list page (expected catalog size: dozens).
- Drag-and-drop reorder (revisit if up/down arrows feel clunky in practice).
- i18n beyond the Hebrew admin vocabulary agreed below.

## 3. Hebrew admin vocabulary (locked)

| Purpose | Hebrew |
|---|---|
| New product | `מוצר חדש` |
| Edit | `ערוך` |
| Delete | `מחק` |
| Available | `זמין` |
| Unavailable | `לא זמין` |
| Display order | `סדר תצוגה` |
| Save | `שמור` |
| Cancel | `ביטול` |
| Primary image | `תמונה ראשית` |
| Additional images | `תמונות נוספות` |
| Add primary image | `הוסף תמונה ראשית` |
| Remove image | `הסר תמונה` |
| Empty list | `עדיין אין מוצרים. הוסיפי את הראשון כדי להתחיל.` |
| Products page title | `מוצרים` |
| Delete confirmation title | `למחוק את המוצר?` |
| Delete confirmation body | `לא ניתן לשחזר פעולה זו.` |

## 4. Architecture

Everything admin-side stays under the existing protected route group `app/admin/(protected)/`. Customer routes are untouched.

```
app/admin/(protected)/
  page.tsx                    # List page (RSC). Replaces current placeholder.
  actions.ts                  # signOut (existing) + toggleAvailable, moveUp, moveDown
  error.tsx                   # Hebrew error boundary for the admin segment (new)
  products/
    new/
      page.tsx                # Create (RSC shell + Client <ProductForm>)
      actions.ts              # createProduct
    [id]/
      edit/
        page.tsx              # Edit (RSC shell + Client <ProductForm>)
        actions.ts            # updateProduct, deleteProduct
  _components/
    product-form.tsx          # Client. Shared create+edit form shell.
    image-uploader.tsx        # Client. 1 primary + up to 4 extras.
    row-actions.tsx           # Client. Toggle + up/down + delete per list row.
lib/
  products/
    schema.ts                 # Zod schema shared by create+edit actions
    queries.ts                # Server-only listProducts, getProduct
    storage.ts                # Path helpers + public-URL ↔ path conversion
supabase/
  migrations/
    0002_product_images.sql   # image_urls column + check + swap_display_order RPC
docs/superpowers/specs/
  2026-04-17-phase-4-admin-crud-design.md   # this file
```

**Rationale:** the list page is a single RSC reading through `queries.listProducts()`. Create and edit are RSC shells around a shared Client `<ProductForm>` island — same component, different initial data and bound action. Row-level list interactions live in small Client islands per row so the outer page remains a Server Component.

## 5. Data model

### 5.1 Existing schema recap

`public.products` (from `0001_init.sql`): `id uuid pk`, `name text`, `price numeric(10,2)`, `description text`, `image_url text`, `is_available boolean`, `display_order integer`, `created_at timestamptz`. RLS: public SELECT, authenticated INSERT/UPDATE/DELETE.

### 5.2 Migration `0002_product_images.sql`

```sql
-- Replace single image_url with ordered array; index 0 is the primary.
alter table public.products
  add column image_urls text[] not null default '{}';

update public.products
  set image_urls = array[image_url]
  where image_url is not null
    and image_url <> ''
    and cardinality(image_urls) = 0;

alter table public.products
  drop column image_url;

alter table public.products
  add constraint products_image_urls_max
  check (cardinality(image_urls) <= 5);

-- Atomic swap for moveUp / moveDown.
create or replace function public.swap_display_order(a uuid, b uuid)
returns void
language plpgsql
security invoker
as $$
declare
  order_a integer;
  order_b integer;
begin
  select display_order into order_a from public.products where id = a for update;
  select display_order into order_b from public.products where id = b for update;

  if order_a is null or order_b is null then
    raise exception 'product not found';
  end if;

  update public.products set display_order = order_b where id = a;
  update public.products set display_order = order_a where id = b;
end;
$$;

grant execute on function public.swap_display_order(uuid, uuid) to authenticated;
```

The function runs as `security invoker`, so the caller's RLS still applies — only authenticated admins can move rows.

### 5.3 Validation (`lib/products/schema.ts`, Zod)

| Field | Rule |
|---|---|
| `name` | trim, 1–80 chars, required |
| `price` | coerced number, `≥ 0`, ≤ 2 decimals |
| `description` | optional, ≤ 500 chars |
| `is_available` | boolean, default `true` |
| `image_urls` | `string[]`, length 1–5, each must look like a Supabase storage public URL |

Invariant: `image_urls[0]` is the primary image and is required.

## 6. Storage conventions

Bucket: `product-images` (public, created in `0001_init.sql`).

- **Path shape:** `<productId>/<uuid>.<ext>` — every file namespaced by its product so deletes are a single prefix sweep.
- **Client-side gate before upload:** `image/jpeg | image/png | image/webp`, `≤ 3 MB`. Rejections surface inline in the uploader; no network call is made.
- **Deterministic product id on create:** `<ProductForm>` generates `crypto.randomUUID()` on mount for create mode and threads it through the uploader and into the `createProduct` insert. This lets the browser upload files before the DB row exists, without orphan risk — if the admin abandons the form, storage has files under an unreferenced UUID, which the bucket's lifecycle will be configured to sweep (cleanup tooling out of scope here, but the path structure leaves the door open).
- **Edit diff-and-delete:** `updateProduct` computes `orphans = oldUrls \ newUrls` and removes those paths *after* the DB update succeeds. Storage failure is logged, not surfaced to the admin — DB is the source of truth and a stray file is a minor cost.
- **Delete cascade:** `deleteProduct` removes the DB row, then does `storage.remove()` on every path derived from that product's `image_urls`.

`lib/products/storage.ts` exports:
- `pathFromPublicUrl(url): string | null` — parses `product-images/...` out of a public URL.
- `buildUploadPath(productId, file): string` — returns `<productId>/<crypto.randomUUID()>.<ext>`.
- `deleteImages(supabase, urls): Promise<void>` — best-effort `.remove()`, logs failures.

## 7. Components

### 7.1 `<ProductForm>` (Client)

Shared shell used by `/admin/products/new` and `/admin/products/[id]/edit`.

Props:
```ts
type ProductFormProps =
  | { mode: 'create'; productId: string }
  | { mode: 'edit'; productId: string; initial: ProductRow };
```

- `useActionState` wired to `createProduct` or `updateProduct`.
- Submit button disabled while `pending || hasPendingUploads`.
- Inline field errors pulled from action result's `fieldErrors`.
- Hebrew labels + RTL layout; leverages existing primitives (`Button`, `Input`, `Label`, `Card`, `Banner`, `Modal`).

### 7.2 `<ImageUploader>` (Client)

Props: `{ productId: string; initialImageUrls: string[]; onChange: (urls, pending) => void }`.

Internal slot state: `empty | uploading | uploaded | error`.

Layout (mobile-first, RTL):
- Primary slot: full-width square on mobile, 2:1 landscape on ≥ sm. Label `תמונה ראשית *`.
- Extras row: horizontal scroll of up to 4 `96×96` thumbnails + add-button at the end. Label `תמונות נוספות`.

Upload flow per file:
1. Client validates type + size. On fail → inline error, no network.
2. `supabase.storage.from('product-images').upload(<path>, file, { upsert: false })` using the browser client from `lib/supabase/client.ts`. Authenticated admin session satisfies RLS.
3. On success, `getPublicUrl(path)` → store URL in the slot.
4. Failure → slot flips to `error` with retry button.
5. Removing an already-uploaded slot only drops it from component state — physical delete happens in `updateProduct`'s diff-and-delete after submit.

Accessibility:
- Each slot is a `<button>` with a Hebrew `aria-label`.
- Remove button ≥ 44 px tap target.
- Keyboard: tab through slots; Enter/Space opens picker or removes.

### 7.3 `<RowActions>` (Client, one per list row)

Props: `{ product: { id, display_order, is_available }, isFirst: boolean, isLast: boolean }`.

Controls (each wrapped in a `<form>` so they work with JS off):
- **Availability switch** — `toggleAvailable(id, next)` via `useTransition` for pending styling.
- **Move up / Move down** — bound to `moveUp(id)` / `moveDown(id)`; `disabled` at boundaries.
- **Edit** — `<Link>` to `/admin/products/{id}/edit`.
- **Delete** — button opens `<Modal>`; modal's primary submit is a `<form action={deleteProduct}>` with a hidden `id`. Hebrew strings per §3.

## 8. Server Actions

All actions start with `'use server'` and an auth guard (redirect to `/admin/login` if no user). All mutations end with `revalidatePath('/admin')`.

### 8.1 `createProduct(formData)`
1. Auth guard.
2. Parse `image_urls` (JSON string) and the rest of the fields; validate with `productSchema`.
3. On validation fail, return `{ error: { fieldErrors } }`.
4. `nextOrder = (max(display_order) ?? -1) + 1`.
5. `insert({ id: productId, ...fields, display_order: nextOrder })`.
6. On DB error return `{ error: { message } }` (uploaded files stay — admin can retry without re-uploading).
7. `revalidatePath('/admin')` → `redirect('/admin')`.

### 8.2 `updateProduct(id, formData)`
1. Auth guard + same validation.
2. Fetch current row; compute `orphans = oldUrls.filter(u => !newUrls.includes(u))`.
3. UPDATE row.
4. If UPDATE succeeded and `orphans.length > 0`, `deleteImages(supabase, orphans)` (best-effort).
5. `revalidatePath('/admin')` → `redirect('/admin')`.

### 8.3 `deleteProduct(id)`
1. Auth guard.
2. Fetch row to get `image_urls`.
3. DELETE row.
4. `deleteImages(supabase, row.image_urls)` (best-effort).
5. `revalidatePath('/admin')` → `redirect('/admin')`.

### 8.4 `toggleAvailable(id, next)`
1. Auth guard.
2. `update({ is_available: next }).eq('id', id)`.
3. `revalidatePath('/admin')`. No redirect.

### 8.5 `moveUp(id)` / `moveDown(id)`
1. Auth guard.
2. Fetch the product and its neighbour by `display_order`. If at the boundary, no-op.
3. `rpc('swap_display_order', { a, b })`.
4. `revalidatePath('/admin')`.

## 9. Read path

`lib/products/queries.ts` (server-only):
- `listProducts()` → `select * order by display_order asc, created_at asc`.
- `getProduct(id)` → single row; 404 if missing.

Both are called from RSC pages. Mutations call `revalidatePath('/admin')` so the next navigation sees fresh data.

## 10. Error handling

- **Validation + domain errors:** actions return a typed result; `<ProductForm>` renders inline via `useActionState`.
- **Unexpected errors:** thrown → caught by `app/admin/(protected)/error.tsx`, a new Hebrew error boundary with a retry button.
- **Storage failures during best-effort cleanup:** logged, not surfaced — the admin's intent (create/update/delete) already succeeded against the DB.

## 11. List page layout

- **Header:** title `מוצרים`, primary CTA `מוצר חדש` → `/admin/products/new`.
- **Empty state:** centered card, Hebrew copy from §3, same CTA.
- **Mobile (< sm):** vertical stack of product cards. Each card shows a 64 px primary thumbnail (right-aligned for RTL), name + price stacked, then a row of controls.
- **≥ sm:** table-like grid with columns `thumb | name | price | availability | reorder | edit | delete`.
- Unavailable rows: faded thumbnail + `לא זמין` pill.

## 12. Verification (must pass before commit)

1. `npm run build` — TS and ESLint clean.
2. `npm run dev`, exercise in Chrome DevTools at **375 / 430 / 768 / 1024**:
   - Empty state renders.
   - Create product with 1 image → appears in list.
   - Create product with 5 images → primary renders as list thumb, edit page shows all 5 in order.
   - Attempt 6th image → rejected inline.
   - Upload > 3 MB file → rejected inline, no network call.
   - Upload non-image → rejected inline.
   - Edit: remove an extra → orphan gone from storage bucket (Supabase dashboard check).
   - Edit: remove the current primary → next slot becomes primary on save.
   - Toggle availability → UI updates after revalidation; DB matches.
   - Move up / move down → order persists across refresh; arrows disable at boundaries.
   - Delete product with 3 images → row gone + all 3 storage paths gone.
   - Submit form while upload is pending → submit disabled.
3. RTL: all Hebrew strings right-aligned. Reorder arrows are vertical (up/down) so no RTL mirroring needed.
4. Signed-out admin hitting any `/admin/*` page bounces to `/admin/login` as in Phase 2.

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Orphaned uploads if admin abandons create form | Files namespaced by pre-generated `productId`; cleanup tooling planned in a later phase. Not user-visible. |
| Race on `moveUp` / `moveDown` with two admins | `swap_display_order` RPC uses `SELECT ... FOR UPDATE`, making the swap atomic. |
| Storage delete fails silently | Logged; DB remains correct. Worst case is billable bytes, not broken UX. |
| Server Action body size limits | Avoided entirely — uploads go direct to Supabase; Server Actions only receive metadata + URL strings. |
| Admin uploads huge files | Client-side 3 MB gate before any network call. |

## 14. Open questions (none blocking implementation)

- Image cropping / primary-image crop ratio — none in this phase; we rely on CSS `object-fit: cover`.
- Lifecycle rules for orphaned uploads — tracked separately; not blocking.
