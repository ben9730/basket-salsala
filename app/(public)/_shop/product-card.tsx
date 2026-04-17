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
