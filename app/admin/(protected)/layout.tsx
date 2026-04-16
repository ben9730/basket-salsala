import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions';

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg">{businessName}</span>
            <span className="text-xs text-neutral-500">ניהול</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-600 sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="h-11 rounded-md border border-neutral-300 bg-white px-4 text-sm transition-colors hover:bg-neutral-50"
              >
                התנתקות
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
