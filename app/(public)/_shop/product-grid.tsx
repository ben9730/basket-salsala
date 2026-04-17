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
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {products.map((p) => (
            <div
              key={p.id}
              className="w-[min(100%,360px)] min-[430px]:w-[340px] lg:w-[400px]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
