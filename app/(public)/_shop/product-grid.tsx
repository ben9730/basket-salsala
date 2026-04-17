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
              className="w-[min(100%,320px)] min-[430px]:w-[300px] lg:w-[340px]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
