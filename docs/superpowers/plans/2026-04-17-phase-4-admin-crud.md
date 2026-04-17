# Phase 4 — Admin Product CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the admin-only product CRUD (list, create, edit, delete, toggle availability, reorder) with 1 primary + up to 4 extra images per product, direct-to-Supabase uploads, Hebrew RTL UI, and Playwright E2E coverage.

**Architecture:** RSC pages with small Client islands for interactive pieces. Uploads go directly from the browser to Supabase Storage (authenticated admin session); Server Actions only handle metadata + URL lists. Atomic reorder via a Postgres RPC. Mobile-first verified at 375 / 430 / 768 / 1024.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + Storage + Auth), Zod, `browser-image-compression`, Tailwind + existing design system primitives, Playwright (`@playwright/test`).

**Design spec:** `docs/superpowers/specs/2026-04-17-phase-4-admin-crud-design.md` — read before starting.

---

## File Structure

**Create:**
- `supabase/migrations/0002_product_images.sql` — array column + RPC
- `lib/products/schema.ts` — Zod schema for product + form parser
- `lib/products/queries.ts` — server-only `listProducts`, `getProduct`
- `lib/products/storage.ts` — path helpers, URL ↔ path, bulk delete
- `app/admin/(protected)/error.tsx` — Hebrew segment error boundary
- `app/admin/(protected)/_components/product-form.tsx` — shared Client form
- `app/admin/(protected)/_components/image-uploader.tsx` — 1 primary + up to 4 extras
- `app/admin/(protected)/_components/row-actions.tsx` — toggle + reorder + delete
- `app/admin/(protected)/_components/confirm-delete.tsx` — confirm modal island
- `app/admin/(protected)/products/new/page.tsx`
- `app/admin/(protected)/products/new/actions.ts` — `createProduct`
- `app/admin/(protected)/products/[id]/edit/page.tsx`
- `app/admin/(protected)/products/[id]/edit/actions.ts` — `updateProduct`, `deleteProduct`
- `playwright.config.ts` — test config
- `tests/e2e/helpers.ts` — login helper + cleanup helper
- `tests/e2e/admin-crud.spec.ts` — the product CRUD flows

**Modify:**
- `app/admin/(protected)/page.tsx` — replace placeholder with real list
- `app/admin/(protected)/actions.ts` — append `toggleAvailable`, `moveUp`, `moveDown`
- `package.json` / `package-lock.json` — add `zod`, `@playwright/test`
- `.gitignore` — ignore `test-results/`, `playwright-report/`
- `.env.example` — document `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (commented-out lines)

**Dependencies:** each task builds on the previous, in order. No parallelisation.

---

### Task 0: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `.gitignore`

- [ ] **Step 1: Add `zod` as a runtime dep**

Run: `npm install zod`

Expected: `zod` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Add Playwright as a dev dep and install Chromium**

Run:
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: `@playwright/test` appears in `devDependencies`; Chromium browser downloaded.

- [ ] **Step 3: Update `.gitignore`**

Append:
```
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

- [ ] **Step 4: Type-check and build**

Run: `npm run build`
Expected: build passes, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "Phase 4 Task 0: add zod + Playwright deps"
```

---

### Task 1: Playwright config + smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers.ts`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'he-IL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Create `tests/e2e/helpers.ts` with login helper**

```ts
import type { Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set to run E2E tests.');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel(/אימייל|email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/סיסמה|password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /התחברות|sign in/i }).click();
  await page.waitForURL('**/admin');
}
```

- [ ] **Step 2b: Document and set E2E env vars**

Append to `.env.example` (create if it doesn't already hold these):
```
# Playwright E2E (local dev / CI only — not used by the app)
# E2E_ADMIN_EMAIL=
# E2E_ADMIN_PASSWORD=
```

Set the real values in your local `.env.local` using the admin account Shlomi or Bat-Chen created during Phase 2. Keep them out of git.

- [ ] **Step 3: Create `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('unauthed /admin redirects to /admin/login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});
```

- [ ] **Step 4: Add test script to `package.json`**

In the `scripts` object, add:
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed"
```

- [ ] **Step 5: Run the smoke tests**

Run: `npm run test:e2e`
Expected: both tests pass against the running dev server.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/ package.json
git commit -m "Phase 4 Task 1: Playwright config + smoke tests"
```

---

### Task 2: DB migration — image_urls array + swap RPC

**Files:**
- Create: `supabase/migrations/0002_product_images.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Phase 4: replace single image_url with ordered image_urls[]
-- and add an atomic swap function for reorder.

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

- [ ] **Step 2: Apply the migration**

Apply via Supabase CLI (`supabase db push`) or paste into the Supabase SQL editor for the project and run.

- [ ] **Step 3: Verify in the DB**

In the SQL editor run:
```sql
select column_name, data_type from information_schema.columns
  where table_name = 'products' and table_schema = 'public';
```
Expected: `image_urls` is `ARRAY`, and no row for `image_url`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_product_images.sql
git commit -m "Phase 4 Task 2: image_urls[] + swap_display_order RPC"
```

---

### Task 3: `lib/products/schema.ts` — Zod schema + form parser

**Files:**
- Create: `lib/products/schema.ts`

- [ ] **Step 1: Write the schema**

```ts
import { z } from 'zod';

const PUBLIC_URL_RE =
  /\/storage\/v1\/object\/public\/product-images\/[^/]+\/[^/]+\.(?:jpe?g|png|webp)$/i;

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'שם נדרש').max(80, 'שם ארוך מדי'),
  price: z
    .number({ invalid_type_error: 'מחיר חייב להיות מספר' })
    .nonnegative('מחיר לא יכול להיות שלילי')
    .multipleOf(0.01, 'מחיר עד שתי ספרות אחרי הנקודה'),
  description: z
    .string()
    .trim()
    .max(500, 'תיאור ארוך מדי')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  is_available: z.boolean(),
  image_urls: z
    .array(z.string().regex(PUBLIC_URL_RE, 'כתובת תמונה לא חוקית'))
    .min(1, 'יש להעלות לפחות תמונה ראשית')
    .max(5, 'לכל היותר 5 תמונות'),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; fieldErrors?: Record<string, string>; message?: string };

export function parseProductForm(formData: FormData, id: string): ActionResult<ProductInput> {
  const rawImages = formData.get('image_urls');
  let imageUrls: unknown = [];
  if (typeof rawImages === 'string' && rawImages.length > 0) {
    try {
      imageUrls = JSON.parse(rawImages);
    } catch {
      return { ok: false, fieldErrors: { image_urls: 'רשימת תמונות לא חוקית' } };
    }
  }

  const result = productSchema.safeParse({
    id,
    name: formData.get('name'),
    price: Number(formData.get('price')),
    description: formData.get('description') ?? '',
    is_available: formData.get('is_available') === 'on',
    image_urls: imageUrls,
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: result.data };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/products/schema.ts
git commit -m "Phase 4 Task 3: product Zod schema + form parser"
```

---

### Task 4: `lib/products/storage.ts` — upload path + URL helpers

**Files:**
- Create: `lib/products/storage.ts`

- [ ] **Step 1: Write the helpers**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

const PUBLIC_URL_SEGMENT = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

export function buildUploadPath(productId: string, file: File): string {
  const ext = extensionFor(file);
  const uuid =
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid();
  return `${productId}/${uuid}.${ext}`;
}

export function pathFromPublicUrl(url: string): string | null {
  const idx = url.indexOf(PUBLIC_URL_SEGMENT);
  if (idx === -1) return null;
  return url.slice(idx + PUBLIC_URL_SEGMENT.length);
}

export async function deleteImages(
  supabase: SupabaseClient,
  urls: string[],
): Promise<void> {
  if (urls.length === 0) return;
  const paths = urls.map(pathFromPublicUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) console.error('[storage] deleteImages failed', error, paths);
}

export async function deleteProductPrefix(
  supabase: SupabaseClient,
  productId: string,
  knownUrls: string[],
): Promise<void> {
  await deleteImages(supabase, knownUrls);
}

function extensionFor(file: File): string {
  const fromType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const byType = fromType[file.type];
  if (byType) return byType;
  const match = /\.([a-z0-9]+)$/i.exec(file.name);
  return match ? match[1].toLowerCase() : 'bin';
}

function fallbackUuid(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/products/storage.ts
git commit -m "Phase 4 Task 4: storage helpers for product images"
```

---

### Task 5: `lib/products/queries.ts` — server-only reads

**Files:**
- Create: `lib/products/queries.ts`

- [ ] **Step 1: Write the reads**

```ts
import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_urls: string[];
  is_available: boolean;
  display_order: number;
  created_at: string;
};

export async function listProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export async function getProduct(id: string): Promise<ProductRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  return data as ProductRow;
}

export async function nextDisplayOrder(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.display_order ?? -1) + 1;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/products/queries.ts
git commit -m "Phase 4 Task 5: product queries"
```

---

### Task 6: Admin segment error boundary

**Files:**
- Create: `app/admin/(protected)/error.tsx`

- [ ] **Step 1: Write the boundary**

```tsx
'use client';

import { Button } from '@/components/ui/button';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display mb-2 text-2xl font-medium">משהו השתבש</h1>
      <p className="mb-6 text-sm text-neutral-600">
        לא הצלחנו לטעון את העמוד. נסי שוב בעוד רגע.
      </p>
      <Button onClick={reset} variant="primary" size="md">
        נסי שוב
      </Button>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/error.tsx
git commit -m "Phase 4 Task 6: Hebrew error boundary for admin segment"
```

---

### Task 7: List page — read-only render

**Files:**
- Modify: `app/admin/(protected)/page.tsx`
- Create: `tests/e2e/admin-crud.spec.ts`

- [ ] **Step 1: Replace the placeholder list page**

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { listProducts } from '@/lib/products/queries';

export default async function AdminDashboardPage() {
  const products = await listProducts();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">מוצרים</h1>
        <Button asChild variant="primary" size="md">
          <Link href="/admin/products/new">מוצר חדש</Link>
        </Button>
      </header>

      {products.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="mb-4 text-sm text-neutral-600">
            עדיין אין מוצרים. הוסיפי את הראשון כדי להתחיל.
          </p>
          <Button asChild variant="primary" size="md">
            <Link href="/admin/products/new">מוצר חדש</Link>
          </Button>
        </Card>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-4">
              {p.image_urls[0] ? (
                <img
                  src={p.image_urls[0]}
                  alt=""
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-neutral-100" />
              )}
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-neutral-600">₪{p.price.toFixed(2)}</p>
              </div>
              {!p.is_available && (
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                  לא זמין
                </span>
              )}
              <Button asChild variant="secondary" size="sm">
                <Link href={`/admin/products/${p.id}/edit`}>ערוך</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

If `Button` does not support `asChild`, wrap it inside the `Link` or render `<Link className={...}>` with the same classes; check `components/ui/button.tsx` and adapt.

- [ ] **Step 2: Write failing E2E test for empty state**

`tests/e2e/admin-crud.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('admin product CRUD', () => {
  test('empty state shows Hebrew copy and CTA', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'מוצרים' })).toBeVisible();
    // At least one "מוצר חדש" CTA is visible (header or empty state).
    await expect(page.getByRole('link', { name: 'מוצר חדש' }).first()).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test:e2e -- --grep "empty state"`
Expected: passes (assuming DB has 0 products) or fails informatively if products exist — in that case, delete them in the Supabase dashboard, then re-run.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(protected\)/page.tsx tests/e2e/admin-crud.spec.ts
git commit -m "Phase 4 Task 7: product list read-only render + empty-state test"
```

---

### Task 8: Image uploader island

**Files:**
- Create: `app/admin/(protected)/_components/image-uploader.tsx`

- [ ] **Step 1: Write the uploader**

```tsx
'use client';

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { buildUploadPath, PRODUCT_IMAGES_BUCKET } from '@/lib/products/storage';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB after compression
const EXTRA_SLOT_COUNT = 4;

type Slot =
  | { status: 'empty' }
  | { status: 'uploading'; previewUrl: string }
  | { status: 'uploaded'; url: string }
  | { status: 'error'; previewUrl: string; message: string };

export type ImageUploaderProps = {
  productId: string;
  initialImageUrls: string[];
  onChange: (urls: string[], hasPending: boolean) => void;
};

export function ImageUploader({
  productId,
  initialImageUrls,
  onChange,
}: ImageUploaderProps) {
  const [primary, setPrimary] = useState<Slot>(() =>
    initialImageUrls[0] ? { status: 'uploaded', url: initialImageUrls[0] } : { status: 'empty' },
  );
  const [extras, setExtras] = useState<Slot[]>(() => {
    const arr: Slot[] = [];
    for (let i = 0; i < EXTRA_SLOT_COUNT; i++) {
      const url = initialImageUrls[i + 1];
      arr.push(url ? { status: 'uploaded', url } : { status: 'empty' });
    }
    return arr;
  });

  const emit = useCallback(
    (nextPrimary: Slot, nextExtras: Slot[]) => {
      const urls: string[] = [];
      if (nextPrimary.status === 'uploaded') urls.push(nextPrimary.url);
      for (const s of nextExtras) if (s.status === 'uploaded') urls.push(s.url);
      const hasPending =
        nextPrimary.status === 'uploading' ||
        nextExtras.some((s) => s.status === 'uploading');
      onChange(urls, hasPending);
    },
    [onChange],
  );

  const handleUpload = useCallback(
    async (file: File, assign: (slot: Slot) => void) => {
      if (!ACCEPT.split(',').includes(file.type)) {
        assign({ status: 'error', previewUrl: URL.createObjectURL(file), message: 'סוג קובץ לא נתמך' });
        return;
      }

      let prepared: File = file;
      try {
        prepared = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });
      } catch {
        // compression is best-effort; fall back to original
      }

      if (prepared.size > MAX_BYTES) {
        assign({
          status: 'error',
          previewUrl: URL.createObjectURL(file),
          message: 'הקובץ גדול מ-3MB גם אחרי דחיסה',
        });
        return;
      }

      const previewUrl = URL.createObjectURL(prepared);
      assign({ status: 'uploading', previewUrl });

      const supabase = createClient();
      const path = buildUploadPath(productId, prepared);
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, prepared, { upsert: false, contentType: prepared.type });

      if (error) {
        assign({ status: 'error', previewUrl, message: 'העלאה נכשלה' });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
      assign({ status: 'uploaded', url: publicUrl });
    },
    [productId],
  );

  const assignPrimary = (slot: Slot) =>
    setPrimary((prev) => {
      const next = slot;
      emit(next, extras);
      return next;
    });

  const assignExtra = (index: number) => (slot: Slot) =>
    setExtras((prev) => {
      const next = prev.map((s, i) => (i === index ? slot : s));
      emit(primary, next);
      return next;
    });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          תמונה ראשית <span className="text-red-600">*</span>
        </label>
        <SlotView
          slot={primary}
          aspect="sm:aspect-[2/1] aspect-square"
          emptyLabel="הוסף תמונה ראשית"
          onPick={(f) => handleUpload(f, assignPrimary)}
          onClear={() => assignPrimary({ status: 'empty' })}
          size="primary"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">תמונות נוספות</label>
        <ul className="flex gap-2 overflow-x-auto pb-2">
          {extras.map((slot, i) => (
            <li key={i} className="shrink-0">
              <SlotView
                slot={slot}
                aspect="aspect-square w-24"
                emptyLabel="הוסף"
                onPick={(f) => handleUpload(f, assignExtra(i))}
                onClear={() => assignExtra(i)({ status: 'empty' })}
                size="thumb"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* hidden input that the parent form reads */}
      <input type="hidden" name="image_urls" value={JSON.stringify(urlsOf(primary, extras))} />
    </div>
  );
}

function urlsOf(primary: Slot, extras: Slot[]): string[] {
  const urls: string[] = [];
  if (primary.status === 'uploaded') urls.push(primary.url);
  for (const s of extras) if (s.status === 'uploaded') urls.push(s.url);
  return urls;
}

type SlotViewProps = {
  slot: Slot;
  aspect: string;
  emptyLabel: string;
  onPick: (file: File) => void;
  onClear: () => void;
  size: 'primary' | 'thumb';
};

function SlotView({ slot, aspect, emptyLabel, onPick, onClear, size }: SlotViewProps) {
  const base = `relative ${aspect} overflow-hidden rounded border border-border bg-neutral-50`;

  if (slot.status === 'empty') {
    return (
      <label className={`${base} flex cursor-pointer items-center justify-center text-sm text-neutral-500 hover:bg-neutral-100`}>
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) onPick(f);
          }}
        />
        {emptyLabel}
      </label>
    );
  }

  const preview = slot.status === 'uploaded' ? slot.url : slot.previewUrl;
  return (
    <div className={base}>
      <img src={preview} alt="" className="h-full w-full object-cover" />
      {slot.status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs text-white">
          מעלה…
        </div>
      )}
      {slot.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-600/70 p-2 text-center text-xs text-white">
          {slot.message}
        </div>
      )}
      {slot.status !== 'uploading' && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg shadow hover:bg-white"
          aria-label="הסר תמונה"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/_components/image-uploader.tsx
git commit -m "Phase 4 Task 8: image uploader island"
```

---

### Task 9: Shared product form

**Files:**
- Create: `app/admin/(protected)/_components/product-form.tsx`

- [ ] **Step 1: Write the form shell**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { ImageUploader } from './image-uploader';
import type { ActionResult, ProductInput } from '@/lib/products/schema';

type Mode =
  | { mode: 'create'; productId: string }
  | { mode: 'edit'; productId: string; initial: ProductInput };

export type ProductFormProps = Mode & {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
};

export function ProductForm(props: ProductFormProps) {
  const { mode, productId, action, submitLabel } = props;
  const initial = mode === 'edit' ? props.initial : null;

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  const [hasPendingUploads, setHasPendingUploads] = useState(false);

  const errors = !state?.ok ? state?.fieldErrors ?? {} : {};
  const message = !state?.ok ? state?.message : undefined;

  const initialUrls = useMemo(() => initial?.image_urls ?? [], [initial]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={productId} />

      <div>
        <Label htmlFor="name">שם המוצר</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ''} required maxLength={80} />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="price">מחיר (₪)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={initial?.price?.toString() ?? ''}
          required
        />
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={initial?.description ?? ''}
          className="w-full rounded border border-border bg-surface p-2 text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_available"
          name="is_available"
          type="checkbox"
          defaultChecked={initial?.is_available ?? true}
          className="h-4 w-4"
        />
        <Label htmlFor="is_available">זמין</Label>
      </div>

      <ImageUploader
        productId={productId}
        initialImageUrls={initialUrls}
        onChange={(_urls, pendingUploads) => setHasPendingUploads(pendingUploads)}
      />
      {errors.image_urls && (
        <p className="mt-1 text-sm text-red-600">{errors.image_urls}</p>
      )}

      {message && <Banner variant="error">{message}</Banner>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="md" disabled={pending || hasPendingUploads}>
          {pending ? 'שומר…' : submitLabel}
        </Button>
        <Button asChild variant="ghost" size="md">
          <a href="/admin">ביטול</a>
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/_components/product-form.tsx
git commit -m "Phase 4 Task 9: shared product form island"
```

---

### Task 10: Create product — page + action + E2E

**Files:**
- Create: `app/admin/(protected)/products/new/page.tsx`
- Create: `app/admin/(protected)/products/new/actions.ts`
- Modify: `tests/e2e/admin-crud.spec.ts`

- [ ] **Step 1: Write the Server Action**

`app/admin/(protected)/products/new/actions.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseProductForm, type ActionResult } from '@/lib/products/schema';
import { nextDisplayOrder } from '@/lib/products/queries';

export async function createProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, message: 'מזהה מוצר חסר' };

  const parsed = parseProductForm(formData, id);
  if (!parsed.ok) return parsed;

  const displayOrder = await nextDisplayOrder();
  const { error } = await supabase.from('products').insert({
    id,
    name: parsed.data!.name,
    price: parsed.data!.price,
    description: parsed.data!.description ?? null,
    image_urls: parsed.data!.image_urls,
    is_available: parsed.data!.is_available,
    display_order: displayOrder,
  });

  if (error) return { ok: false, message: `שגיאת שמירה: ${error.message}` };

  revalidatePath('/admin');
  redirect('/admin');
}
```

- [ ] **Step 2: Write the create page**

`app/admin/(protected)/products/new/page.tsx`:
```tsx
import { ProductForm } from '../../_components/product-form';
import { createProduct } from './actions';

export default function NewProductPage() {
  const productId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : require('node:crypto').randomUUID();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display mb-6 text-2xl font-medium">מוצר חדש</h1>
      <ProductForm
        mode="create"
        productId={productId}
        action={createProduct}
        submitLabel="שמור"
      />
    </section>
  );
}
```

- [ ] **Step 3: Extend the E2E spec with a create flow test**

Append to `tests/e2e/admin-crud.spec.ts`:
```ts
import path from 'node:path';

test('create product with primary + one extra image', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/products/new');

  await page.getByLabel('שם המוצר').fill('Test Product ' + Date.now());
  await page.getByLabel('מחיר (₪)').fill('99.90');
  await page.getByLabel('תיאור').fill('בדיקה אוטומטית');

  const fixturesDir = path.join(__dirname, 'fixtures');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles(path.join(fixturesDir, 'sample-1.jpg'));

  await page
    .locator('input[type=file]')
    .nth(1)
    .setInputFiles(path.join(fixturesDir, 'sample-2.jpg'));

  await page.getByRole('button', { name: 'שמור' }).click();
  await page.waitForURL('**/admin');

  await expect(page.getByText(/Test Product/)).toBeVisible();
});
```

- [ ] **Step 4: Add test fixtures**

Create `tests/e2e/fixtures/sample-1.jpg` and `tests/e2e/fixtures/sample-2.jpg` — two small real JPG files (~200 KB each). Can be any licensed photos you own.

- [ ] **Step 5: Run the test**

Run: `npm run test:e2e -- --grep "create product"`
Expected: passes. If it fails on selector for labels (because `Input` doesn't associate `htmlFor` correctly), adjust locators or fix the underlying `Input` primitive.

- [ ] **Step 6: Commit**

```bash
git add app/admin/\(protected\)/products/new tests/e2e
git commit -m "Phase 4 Task 10: create product flow + E2E"
```

---

### Task 11: Edit product — page + update/delete actions + E2E

**Files:**
- Create: `app/admin/(protected)/products/[id]/edit/page.tsx`
- Create: `app/admin/(protected)/products/[id]/edit/actions.ts`
- Create: `app/admin/(protected)/_components/confirm-delete.tsx`
- Modify: `tests/e2e/admin-crud.spec.ts`

- [ ] **Step 1: Write update + delete actions**

`app/admin/(protected)/products/[id]/edit/actions.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseProductForm, type ActionResult } from '@/lib/products/schema';
import { deleteImages } from '@/lib/products/storage';

export async function updateProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, message: 'מזהה מוצר חסר' };

  const parsed = parseProductForm(formData, id);
  if (!parsed.ok) return parsed;

  const { data: existing, error: readErr } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', id)
    .maybeSingle();
  if (readErr || !existing) return { ok: false, message: 'המוצר לא נמצא' };

  const oldUrls = (existing.image_urls ?? []) as string[];
  const newUrls = parsed.data!.image_urls;
  const orphans = oldUrls.filter((u) => !newUrls.includes(u));

  const { error: updErr } = await supabase
    .from('products')
    .update({
      name: parsed.data!.name,
      price: parsed.data!.price,
      description: parsed.data!.description ?? null,
      image_urls: newUrls,
      is_available: parsed.data!.is_available,
    })
    .eq('id', id);

  if (updErr) return { ok: false, message: `שגיאת עדכון: ${updErr.message}` };

  if (orphans.length > 0) await deleteImages(supabase, orphans);

  revalidatePath('/admin');
  redirect('/admin');
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin');

  const { data: existing } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(`שגיאת מחיקה: ${error.message}`);

  if (existing?.image_urls?.length) {
    await deleteImages(supabase, existing.image_urls);
  }

  revalidatePath('/admin');
  redirect('/admin');
}
```

- [ ] **Step 2: Write the confirm-delete island**

`app/admin/(protected)/_components/confirm-delete.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { deleteProduct } from '../products/[id]/edit/actions';

export function ConfirmDelete({ id, label = 'מחק' }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <Modal onClose={() => setOpen(false)} title="למחוק את המוצר?">
          <p className="mb-4 text-sm text-neutral-600">לא ניתן לשחזר פעולה זו.</p>
          <form action={deleteProduct} className="flex justify-end gap-2">
            <input type="hidden" name="id" value={id} />
            <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" variant="danger" size="md">
              מחק
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
```

If `Modal` signature differs from `{ onClose, title }`, read `components/ui/modal.tsx` and adapt this island to match.

- [ ] **Step 3: Write the edit page**

`app/admin/(protected)/products/[id]/edit/page.tsx`:
```tsx
import { ProductForm } from '../../../_components/product-form';
import { ConfirmDelete } from '../../../_components/confirm-delete';
import { getProduct } from '@/lib/products/queries';
import { updateProduct } from './actions';

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">עריכת מוצר</h1>
        <ConfirmDelete id={product.id} />
      </header>
      <ProductForm
        mode="edit"
        productId={product.id}
        initial={{
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description ?? undefined,
          is_available: product.is_available,
          image_urls: product.image_urls,
        }}
        action={updateProduct}
        submitLabel="שמור"
      />
    </section>
  );
}
```

- [ ] **Step 4: Extend the E2E spec with edit and delete flows**

Append to `tests/e2e/admin-crud.spec.ts`:
```ts
test('edit product name and price', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  await page.getByRole('link', { name: 'ערוך' }).first().click();
  await page.getByLabel('שם המוצר').fill('Edited ' + Date.now());
  await page.getByLabel('מחיר (₪)').fill('123.45');
  await page.getByRole('button', { name: 'שמור' }).click();
  await page.waitForURL('**/admin');
  await expect(page.getByText(/Edited/)).toBeVisible();
});

test('delete product', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  await page.getByRole('link', { name: 'ערוך' }).first().click();
  await page.getByRole('button', { name: 'מחק' }).first().click(); // opens modal
  await page.getByRole('button', { name: 'מחק' }).nth(1).click(); // modal submit
  await page.waitForURL('**/admin');
});
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:e2e -- --grep "edit product|delete product"`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add app/admin/\(protected\)/products/\[id\]/edit app/admin/\(protected\)/_components/confirm-delete.tsx tests/e2e
git commit -m "Phase 4 Task 11: edit + delete flows with modal"
```

---

### Task 12: Toggle available + reorder arrows on list

**Files:**
- Modify: `app/admin/(protected)/actions.ts`
- Create: `app/admin/(protected)/_components/row-actions.tsx`
- Modify: `app/admin/(protected)/page.tsx`
- Modify: `tests/e2e/admin-crud.spec.ts`

- [ ] **Step 1: Append list-level actions**

Append to `app/admin/(protected)/actions.ts` (keep `signOut`):
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return supabase;
}

export async function toggleAvailable(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const next = formData.get('next') === 'true';
  if (!id) return;
  await supabase.from('products').update({ is_available: next }).eq('id', id);
  revalidatePath('/admin');
}

export async function moveUp(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { data: cur } = await supabase
    .from('products')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!cur) return;
  const { data: prev } = await supabase
    .from('products')
    .select('id, display_order')
    .lt('display_order', cur.display_order)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prev) return;
  await supabase.rpc('swap_display_order', { a: cur.id, b: prev.id });
  revalidatePath('/admin');
}

export async function moveDown(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { data: cur } = await supabase
    .from('products')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!cur) return;
  const { data: nxt } = await supabase
    .from('products')
    .select('id, display_order')
    .gt('display_order', cur.display_order)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!nxt) return;
  await supabase.rpc('swap_display_order', { a: cur.id, b: nxt.id });
  revalidatePath('/admin');
}
```

The existing `signOut` stays as-is in the same file.

- [ ] **Step 2: Write row-actions island**

`app/admin/(protected)/_components/row-actions.tsx`:
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { toggleAvailable, moveUp, moveDown } from '../actions';
import { ConfirmDelete } from './confirm-delete';

export function RowActions({
  product,
  isFirst,
  isLast,
}: {
  product: { id: string; is_available: boolean };
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleAvailable}>
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="next" value={product.is_available ? 'false' : 'true'} />
        <Button type="submit" variant="ghost" size="sm">
          {product.is_available ? 'סמן כלא זמין' : 'סמן כזמין'}
        </Button>
      </form>
      <form action={moveUp}>
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="ghost" size="sm" disabled={isFirst} aria-label="הזז למעלה">
          ↑
        </Button>
      </form>
      <form action={moveDown}>
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="ghost" size="sm" disabled={isLast} aria-label="הזז למטה">
          ↓
        </Button>
      </form>
      <ConfirmDelete id={product.id} />
    </div>
  );
}
```

- [ ] **Step 3: Wire row-actions into the list**

Modify `app/admin/(protected)/page.tsx`. Inside the product `<li>`, replace the isolated `ערוך` Button with this block (keep thumbnail, name, price, lo‑zamin pill as-is):

```tsx
<div className="flex items-center gap-2">
  <Button asChild variant="secondary" size="sm">
    <Link href={`/admin/products/${p.id}/edit`}>ערוך</Link>
  </Button>
  <RowActions
    product={{ id: p.id, is_available: p.is_available }}
    isFirst={i === 0}
    isLast={i === products.length - 1}
  />
</div>
```

Add `import { RowActions } from './_components/row-actions';` at the top, and change `products.map((p) =>` to `products.map((p, i) =>`.

- [ ] **Step 4: Extend E2E with toggle + reorder tests**

Append to `tests/e2e/admin-crud.spec.ts` (assumes at least 2 products exist from earlier create tests — add a precondition that creates them if missing, or rely on create tests running first since `fullyParallel: false`):

```ts
test('toggle availability updates the pill', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  const row = page.locator('li').first();
  await row.getByRole('button', { name: /סמן כ/ }).click();
  await page.waitForLoadState('networkidle');
  // After toggle, the opposite label should now be on the button.
  await expect(row.getByRole('button', { name: /סמן כ/ })).toBeVisible();
});

test('move down then move up is identity', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  const firstName = await page.locator('li').first().locator('p.font-medium').textContent();
  await page.locator('li').first().getByRole('button', { name: 'הזז למטה' }).click();
  await page.waitForLoadState('networkidle');
  await page.locator('li').nth(1).getByRole('button', { name: 'הזז למעלה' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('li').first().locator('p.font-medium')).toHaveText(firstName!);
});
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:e2e -- --grep "toggle|move"`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add app/admin/\(protected\)/actions.ts app/admin/\(protected\)/_components/row-actions.tsx app/admin/\(protected\)/page.tsx tests/e2e
git commit -m "Phase 4 Task 12: toggle available + reorder arrows on list"
```

---

### Task 13: Manual verification pass (mobile-first)

**Files:** none

- [ ] **Step 1: `npm run build`**

Expected: passes, no TS errors, no new ESLint warnings.

- [ ] **Step 2: Manual pass in Chrome DevTools**

Run `npm run dev`, log in as admin, then exercise at **375 / 430 / 768 / 1024** (device toolbar):

- Empty state renders correctly after wiping `products` in Supabase dashboard.
- Create product with 1 image → appears in list.
- Create product with 5 images → primary renders as thumb, edit page shows all 5 in order.
- Attempt a 6th image → rejected inline (the 4 extras cap).
- Upload > 3 MB file that cannot compress under 3 MB → rejected inline, no network call.
- Upload a PDF (via forcing the file picker) → rejected inline.
- Edit: remove an extra image, save → orphan file gone from Supabase Storage bucket.
- Edit: remove the current primary → next slot becomes primary after save.
- Toggle availability → pill updates after revalidation; DB reflects change.
- Move up / move down → order persists across refresh; arrows disable at boundaries.
- Delete product with 3 images → row gone and all 3 storage paths gone.
- Submit form while an upload is pending → submit disabled.

- [ ] **Step 3: RTL + a11y spot check**

- `dir="rtl"` on `<html>` (existing).
- All tap targets ≥ 44 px on mobile.
- Keyboard: tab through row actions, Enter triggers form submit.

- [ ] **Step 4: Run the whole E2E suite**

Run: `npm run test:e2e`
Expected: all projects (mobile + desktop) pass.

- [ ] **Step 5: Commit (only if anything changed)**

If no code changed during verification, skip this commit. Otherwise:
```bash
git add -A
git commit -m "Phase 4 Task 13: verification fixes"
```

- [ ] **Step 6: Push**

```bash
git push
```

---

## Self-review checklist (run before handing off)

- Every spec §3 Hebrew label appears in the code produced by this plan.
- §5 migration shape matches Task 2 exactly.
- §6 storage helpers (`buildUploadPath`, `pathFromPublicUrl`, `deleteImages`) appear in Task 4.
- §7 components all have their own task (uploader = T8, product form = T9, row actions = T12, confirm delete = T11).
- §8 Server Actions: `createProduct` (T10), `updateProduct`+`deleteProduct` (T11), `toggleAvailable`+`moveUp`+`moveDown` (T12).
- §10 error boundary created in T6.
- §12 verification list exercised in T13.
- Auth guard present in every action (via `requireAdmin` helper or explicit `getUser` check).
- `image_urls[0]` invariant enforced by `z.array().min(1)` in Task 3.
- Playwright E2E covers the spec's verification checklist end-to-end.
