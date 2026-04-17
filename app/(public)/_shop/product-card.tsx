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
      className="group block overflow-hidden rounded-2xl bg-surface shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <div className="aspect-square w-full overflow-hidden bg-background">
        {primary ? (
          <Image
            src={primary}
            alt={product.name}
            width={600}
            height={600}
            sizes="(min-width: 1024px) 420px, (min-width: 430px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">—</div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 px-5 py-4">
        <span className="font-display text-xl font-medium text-slate-900">
          {product.name}
        </span>
        <span className="font-display text-lg font-medium text-blue-600">
          ₪{PRICE_FORMAT.format(product.price)}
        </span>
      </div>
    </Link>
  );
}
