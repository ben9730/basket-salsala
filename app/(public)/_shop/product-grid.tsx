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
        <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
