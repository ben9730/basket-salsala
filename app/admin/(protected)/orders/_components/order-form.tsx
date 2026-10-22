'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '@/lib/orders/schema';
import type { ActionResult } from '@/lib/products/schema';
import { linkGhost, selectClass } from './styles';

export type FormProduct = { id: string; name: string; price: number; is_available: boolean };

export type OrderFormInitial = {
  id: string;
  name: string;
  phone: string;
  dueDate: string;
  note: string;
  status: OrderStatus;
  isPaid: boolean;
  lines: { productId: string | null; productName: string; unitPrice: number; quantity: number }[];
};

type Line = OrderFormInitial['lines'][number] & { key: number };

export function OrderForm({
  initial,
  defaultDueDate,
  products,
  action,
}: {
  initial?: OrderFormInitial;
  defaultDueDate: string;
  products: FormProduct[];
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const [nextKey, setNextKey] = useState(initial?.lines.length ?? 1);
  const [lines, setLines] = useState<Line[]>(
    initial?.lines.map((l, i) => ({ ...l, key: i })) ?? [
      { key: 0, productId: null, productName: '', unitPrice: 0, quantity: 1 },
    ],
  );

  const errors = !state?.ok ? state?.fieldErrors ?? {} : {};
  const message = !state?.ok ? state?.message : undefined;

  const patch = (key: number, p: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  // A newly picked product takes its current name/price; untouched lines keep their snapshot.
  const pick = (key: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (p) patch(key, { productId: p.id, productName: p.name, unitPrice: p.price });
  };

  const submitted = lines
    .filter((l) => l.productName)
    .map(({ productId, productName, unitPrice, quantity }) => ({
      productId,
      productName,
      unitPrice,
      quantity,
    }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={initial?.id ?? ''} />
      <input type="hidden" name="lines" value={JSON.stringify(submitted)} />

      <div>
        <Label htmlFor="name">שם</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ''} required maxLength={80} />
        {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="phone">טלפון</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          className="text-right"
          defaultValue={initial?.phone ?? ''}
          required
        />
        {errors.phone && <p className="mt-1 text-sm text-danger">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="dueDate">תאריך איסוף</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={initial?.dueDate ?? defaultDueDate}
          required
        />
        {errors.dueDate && <p className="mt-1 text-sm text-danger">{errors.dueDate}</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">מוצרים</legend>
        {lines.map((l) => (
          <div key={l.key} className="rounded-2xl border border-border bg-surface p-3" data-testid="order-line">
            <select
              aria-label="מוצר"
              className={`${selectClass} w-full`}
              value={l.productId ?? ''}
              onChange={(e) => pick(l.key, e.target.value)}
            >
              <option value="" disabled>
                {l.productName ? `${l.productName} (נמחק)` : 'בחרי מוצר'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.is_available ? '' : ' (לא זמין)'}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-3">
              <Input
                aria-label="כמות"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                className="w-24"
                value={l.quantity}
                onChange={(e) => patch(l.key, { quantity: Number(e.target.value) })}
              />
              <span className="flex-1 text-sm text-muted">₪{l.unitPrice.toFixed(2)} ליחידה</span>
              <Button
                type="button"
                variant="ghost"
                aria-label="הסר שורה"
                onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
              >
                הסר
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setLines((ls) => [
              ...ls,
              { key: nextKey, productId: null, productName: '', unitPrice: 0, quantity: 1 },
            ]);
            setNextKey((k) => k + 1);
          }}
        >
          הוספת מוצר
        </Button>
        {errors.lines && <p className="text-sm text-danger">{errors.lines}</p>}
      </fieldset>

      <div>
        <Label htmlFor="note">הערה</Label>
        <Textarea id="note" name="note" rows={3} maxLength={500} defaultValue={initial?.note ?? ''} />
        {errors.note && <p className="mt-1 text-sm text-danger">{errors.note}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <Label htmlFor="status" className="block">
            סטטוס
          </Label>
          <select id="status" name="status" defaultValue={initial?.status ?? 'confirmed'} className={selectClass}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            name="isPaid"
            type="checkbox"
            defaultChecked={initial?.isPaid ?? false}
            className="h-5 w-5 accent-primary focus-visible:outline-2 focus-visible:outline-primary"
          />
          שולם
        </label>
      </div>

      {message && <Banner variant="danger">{message}</Banner>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'שומר…' : 'שמור'}
        </Button>
        <Link href="/admin/orders" className={linkGhost}>
          ביטול
        </Link>
      </div>
    </form>
  );
}
