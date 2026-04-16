'use client';

import { useActionState } from 'react';
import { signIn, type LoginState } from './actions';

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display mb-8 text-center text-3xl font-medium">
        כניסת מנהלים
      </h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-neutral-700">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm text-neutral-700">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 rounded-md bg-neutral-900 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? 'מתחבר...' : 'התחברות'}
        </button>
      </form>
    </main>
  );
}
