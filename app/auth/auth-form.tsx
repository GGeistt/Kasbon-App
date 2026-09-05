"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "./types";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  buttonLabel: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  initialState: AuthFormState;
};

export function AuthForm({
  action,
  buttonLabel,
  footerHref,
  footerLabel,
  footerText,
  initialState,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
        Email
        <input
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-base outline-none transition focus:border-zinc-900"
          name="email"
          placeholder="nama@email.com"
          required
          type="email"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
        Password
        <input
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-base outline-none transition focus:border-zinc-900"
          minLength={6}
          name="password"
          placeholder="Minimal 6 karakter"
          required
          type="password"
        />
      </label>

      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="mt-2 h-11 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sebentar..." : buttonLabel}
      </button>

      <p className="text-center text-sm text-zinc-500">
        {footerText}{" "}
        <Link className="font-semibold text-zinc-950" href={footerHref}>
          {footerLabel}
        </Link>
      </p>
    </form>
  );
}
