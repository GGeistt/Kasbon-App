import { redirect } from "next/navigation";
import { LogOut, Plus, WalletCards } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <WalletCards aria-hidden="true" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Kasbon</h1>
              <p className="text-sm text-zinc-500">
                Halo, {user.email}. Kita siap catat kasbonmu.
              </p>
            </div>
          </div>

          <form action={logout}>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold transition hover:border-zinc-300 hover:bg-zinc-100"
              type="submit"
            >
              <LogOut aria-hidden="true" size={16} />
              Keluar
            </button>
          </form>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Total dihutang ke saya</p>
            <p className="mt-2 text-2xl font-semibold">Rp 0</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Total saya hutang</p>
            <p className="mt-2 text-2xl font-semibold">Rp 0</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Net</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">Rp 0</p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Catatan kasbon</h2>
              <p className="text-sm text-zinc-500">
                Auth sudah nyambung. Berikutnya kita isi data asli dari Supabase.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Catat baru
            </button>
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
            <p className="font-medium">Belum ada data yang ditarik.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Tahap berikutnya: API /api/debts dan CRUD dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
