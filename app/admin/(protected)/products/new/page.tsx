import { ProductForm } from '../../_components/product-form';
import { createProduct } from './actions';

export default function NewProductPage() {
  const productId = crypto.randomUUID();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display mb-6 text-2xl font-medium">מוצר חדש</h1>
      <ProductForm
        mode="create"
        productId={productId}
        action={createProduct}
        submitLabel="שמור"
      />
    </section>
  );
}
