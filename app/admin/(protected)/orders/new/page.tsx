import { listProducts } from '@/lib/products/queries';
import { defaultDaySheetDate } from '@/lib/orders/day-sheet';
import { OrderForm } from '../_components/order-form';
import { saveOrder } from '../actions';

export default async function NewOrderPage() {
  const products = await listProducts();
  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-medium">הזמנה חדשה</h1>
      <OrderForm
        products={products}
        defaultDueDate={defaultDaySheetDate(new Date())}
        action={saveOrder}
      />
    </section>
  );
}
