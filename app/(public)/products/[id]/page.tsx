import { getProduct } from '@/lib/products/queries';
import { ProductDetail } from '../../_shop/product-detail';
import { ContactFooter } from '../../_shop/contact-footer';

type Params = Promise<{ id: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <>
      <ProductDetail product={product} />
      <ContactFooter />
    </>
  );
}
