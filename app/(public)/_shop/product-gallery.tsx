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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index + 1);
      if (e.key === 'ArrowRight') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

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
    <div className="flex w-full flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-background">
        <div
          ref={scrollerRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative h-full w-full shrink-0 snap-start"
              style={{ flex: '0 0 100%' }}
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
