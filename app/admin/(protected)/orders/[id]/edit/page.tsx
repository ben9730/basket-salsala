import { listProducts } from '@/lib/products/queries';
import { getOrder } from '@/lib/orders/queries';
import { OrderForm } from '../../_components/order-form';
import { DeleteOrder } from '../../_components/delete-order';
import { saveOrder } from '../../actions';

type Params = Promise<{ id: string }>;

export default async function EditOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const [order, products] = await Promise.all([getOrder(id), listProducts()]);
  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">עריכת הזמנה #{order.order_number}</h1>
        <DeleteOrder id={order.id} />
      </header>
      <OrderForm
        products={products}
        defaultDueDate={order.due_date}
        action={saveOrder}
        initial={{
          id: order.id,
          name: order.customer_name,
          phone: order.phone,
          dueDate: order.due_date,
          note: order.note ?? '',
          status: order.status,
          isPaid: order.is_paid,
          lines: order.order_lines.map((l) => ({
            productId: l.product_id,
            productName: l.product_name,
            unitPrice: Number(l.unit_price),
            quantity: l.quantity,
          })),
        }}
      />
    </section>
  );
}
