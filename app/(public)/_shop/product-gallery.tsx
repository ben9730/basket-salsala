'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (next: number) => {
      if (images.length === 0) return;
      setIndex((next + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index + 1);
      if (e.key === 'ArrowRight') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-background text-muted">
        —
      </div>
    );
  }

  const active = images[index];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-background">
        <Image
          key={active}
          src={active}
          alt={`${alt} — תמונה ${index + 1}`}
          width={800}
          height={800}
          priority={index === 0}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => go(i)}
              aria-label={`עבור לתמונה ${i + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-opacity duration-200 ${
                i === index
                  ? 'border-foreground'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={src}
                alt=""
                width={120}
                height={120}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
