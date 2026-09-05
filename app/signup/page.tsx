import { WalletCards } from "lucide-react";
import { AuthForm } from "@/app/auth/auth-form";
import { signup } from "@/app/auth/actions";
import { initialAuthFormState } from "@/app/auth/types";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <WalletCards aria-hidden="true" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-950">Bikin akun</h1>
            <p className="text-sm text-zinc-500">Mulai rapihin catatan kasbon.</p>
          </div>
        </div>

        <AuthForm
          action={signup}
          buttonLabel="Daftar"
          footerHref="/login"
          footerLabel="Masuk"
          footerText="Sudah punya akun?"
          initialState={initialAuthFormState}
        />
      </section>
    </main>
  );
}
