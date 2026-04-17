import { listAvailableProducts } from '@/lib/products/queries';
import { ProductCard } from './product-card';

export async function ProductGrid() {
  const products = await listAvailableProducts();

  return (
    <section
      id="catalog"
      aria-label="מוצרים"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
    >
      {products.length === 0 ? (
        <p className="py-8 text-center text-muted">
          עדיין אין מוצרים בקטלוג
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="w-full max-w-[320px] min-[430px]:w-[calc(50%-0.5rem)] min-[430px]:max-w-[340px] lg:w-[calc(33.333%-1rem)] lg:max-w-[360px]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
