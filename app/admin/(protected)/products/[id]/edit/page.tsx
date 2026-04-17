import { ProductForm } from '../../../_components/product-form';
import { ConfirmDelete } from '../../../_components/confirm-delete';
import { getProduct } from '@/lib/products/queries';
import { updateProduct } from './actions';

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">עריכת מוצר</h1>
        <ConfirmDelete id={product.id} />
      </header>
      <ProductForm
        mode="edit"
        productId={product.id}
        initial={{
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description ?? undefined,
          is_available: product.is_available,
          image_urls: product.image_urls,
        }}
        action={updateProduct}
        submitLabel="שמור"
      />
    </section>
  );
}
