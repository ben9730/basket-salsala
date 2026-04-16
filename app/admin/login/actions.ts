'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim();
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return { error: 'נא למלא אימייל וסיסמה' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Log server-side so non-credentials failures (env misconfig, DB errors,
    // GoTrue 500s) are actually debuggable instead of being masked as "wrong pw".
    console.error('[signIn] Supabase auth error', {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    const msg = error.message?.toLowerCase() ?? '';
    if (msg.includes('invalid login credentials')) {
      return { error: 'אימייל או סיסמה שגויים' };
    }
    if (msg.includes('email not confirmed')) {
      return { error: 'המייל טרם אומת' };
    }
    return {
      error: `שגיאת התחברות (${error.code ?? error.status ?? 'unknown'})`,
    };
  }

  redirect('/admin');
}
