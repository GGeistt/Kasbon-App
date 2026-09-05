import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { DashboardClient } from "@/app/dashboard-client";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: debts, error: debtsError } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto mb-4 flex w-full max-w-7xl justify-end">
        <form action={logout}>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold transition hover:border-zinc-300 hover:bg-zinc-100"
            type="submit"
          >
            <LogOut aria-hidden="true" size={16} />
            Keluar
          </button>
        </form>
      </div>
      <DashboardClient
        initialDebts={debts ?? []}
        initialError={debtsError ? "Gagal ambil data kasbon." : ""}
        userEmail={user.email ?? "akun ini"}
      />
    </main>
  );
}
