import Link from 'next/link';
import type { ProductRow } from '@/lib/products/queries';
import { AddToBasketButton } from '@/components/basket/add-to-basket-button';
import { ProductGallery } from './product-gallery';

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductDetail({ product }: { product: ProductRow }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link
        href="/#catalog"
        className="inline-flex items-center gap-1 text-sm text-muted transition-opacity duration-200 hover:opacity-70"
      >
        <BackArrow />
        <span>חזרה לחנות</span>
      </Link>
      <article className="grid gap-8 pb-12 pt-6 md:grid-cols-2 md:gap-14 md:pb-16 md:pt-8">
        <div className="order-1 md:order-2">
          <ProductGallery images={product.image_urls} alt={product.name} />
        </div>
        <div className="order-2 flex flex-col gap-6 md:order-1 md:justify-center">
          {product.is_available ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              זמין להזמנה
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              לא זמין
            </span>
          )}
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            {product.name}
          </h1>
          <p className="font-display text-3xl font-medium text-blue-600">
            ₪{PRICE_FORMAT.format(product.price)}
          </p>
          {product.description ? (
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
              {product.description}
            </p>
          ) : null}
          <div className="pt-2">
            <AddToBasketButton
              productId={product.id}
              name={product.name}
              price={product.price}
              disabled={!product.is_available}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
