'use client';

import { useActionState, useState } from 'react';
import { Banner } from '@/components/ui/banner';
import { signIn, type LoginState } from './actions';

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="hero-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="deco-circle -top-20 -right-20 h-72 w-72 opacity-60" />
      <div className="deco-circle -bottom-32 -left-32 h-96 w-96 opacity-40" />
      <div className="deco-circle right-1/4 top-1/3 h-48 w-48 opacity-30" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/50 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              אזור מנהלים מאובטח
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            <span className="gradient-text block">כניסת מנהלים</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            כניסה עם אימייל וסיסמה
          </p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_1px_3px_rgba(11,37,69,0.04),0_16px_40px_rgba(11,37,69,0.10)] backdrop-blur-xl">
          <form action={formAction} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-900"
              >
                אימייל
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-900"
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-12 text-[15px] text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 transition-colors duration-200 hover:text-slate-600"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {state.error && <Banner variant="danger">{state.error}</Banner>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {pending ? 'מתחבר...' : 'התחברות'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.5 10.5 0 0 1 12 19c-6.5 0-10-7-10-7a19 19 0 0 1 4.22-5.22" />
      <path d="M9.88 4.24A9.7 9.7 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
    </svg>
  );
}
