'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { ImageUploader } from './image-uploader';
import type { ActionResult, ProductInput } from '@/lib/products/schema';

// Ghost button classes extracted from components/ui/button.tsx (no asChild support)
const ghostLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold cursor-pointer ' +
  'transition-all duration-300 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background ' +
  'h-11 px-5 text-[15px] ' +
  'bg-transparent text-foreground hover:bg-surface-alt focus-visible:ring-foreground';

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

      {message && <Banner variant="danger">{message}</Banner>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="md" disabled={pending || hasPendingUploads}>
          {pending ? 'שומר…' : submitLabel}
        </Button>
        <a href="/admin" className={ghostLinkClass}>
          ביטול
        </a>
      </div>
    </form>
  );
}
