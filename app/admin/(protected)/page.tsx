import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { listProducts } from '@/lib/products/queries';

// Button does not support asChild — render <Link> with button classes directly.
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold cursor-pointer ' +
  'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'h-11 px-5 text-[15px] ' +
  'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary';

const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold cursor-pointer ' +
  'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'h-11 px-5 text-[15px] ' +
  'bg-surface text-foreground border border-border hover:bg-surface-alt focus-visible:ring-foreground';

export default async function AdminDashboardPage() {
  const products = await listProducts();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">מוצרים</h1>
        <Link href="/admin/products/new" className={btnPrimary}>
          מוצר חדש
        </Link>
      </header>

      {products.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="mb-4 text-sm text-neutral-600">
            עדיין אין מוצרים. הוסיפי את הראשון כדי להתחיל.
          </p>
          <Link href="/admin/products/new" className={btnPrimary}>
            מוצר חדש
          </Link>
        </Card>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-4">
              {p.image_urls[0] ? (
                <img
                  src={p.image_urls[0]}
                  alt=""
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-neutral-100" />
              )}
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-neutral-600">₪{p.price.toFixed(2)}</p>
              </div>
              {!p.is_available && (
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                  לא זמין
                </span>
              )}
              <Link href={`/admin/products/${p.id}/edit`} className={btnSecondary}>
                ערוך
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
