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
    setPrimary((_prev) => {
      const next = slot;
      emit(next, extras);
      return next;
    });

  const assignExtra = (index: number) => (slot: Slot) =>
    setExtras((_prev) => {
      const next = _prev.map((s, i) => (i === index ? slot : s));
      emit(primary, next);
      return next;
    });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">תמונה ראשית</label>
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

function SlotView({ slot, aspect, emptyLabel, onPick, onClear, size: _size }: SlotViewProps) {
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
