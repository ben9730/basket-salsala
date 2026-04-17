import type { ProductRow } from '@/lib/products/queries';
import { AddToBasketButton } from '@/components/basket/add-to-basket-button';
import { ProductGallery } from './product-gallery';

const PRICE_FORMAT = new Intl.NumberFormat('he-IL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductDetail({ product }: { product: ProductRow }) {
  return (
    <article className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-12">
      <div className="order-1 md:order-2">
        <ProductGallery images={product.image_urls} alt={product.name} />
      </div>
      <div className="order-2 flex flex-col gap-5 md:order-1">
        {!product.is_available ? (
          <span className="inline-flex w-fit rounded-full bg-[#E8DEC9] px-3 py-1 text-xs text-muted">
            לא זמין
          </span>
        ) : null}
        <h1 className="font-display text-4xl font-medium text-foreground">
          {product.name}
        </h1>
        <p className="font-display text-2xl text-muted">
          ₪{PRICE_FORMAT.format(product.price)}
        </p>
        {product.description ? (
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
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
  );
}
