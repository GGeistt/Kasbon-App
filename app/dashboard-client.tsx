"use client";

import {
  BarChart3,
  Check,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DebtType, Database } from "@/lib/supabase/database.types";

type Debt = Database["public"]["Tables"]["debts"]["Row"];
type StatusFilter = "all" | "unsettled" | "settled";
type TypeFilter = "all" | DebtType;
type FormMode = "create" | "edit";
type SortOption = "newest" | "oldest" | "amount_desc" | "amount_asc";

type DashboardClientProps = {
  initialDebts: Debt[];
  initialError?: string;
  userEmail: string;
};

type DebtFormState = {
  amount: string;
  counterpart_name: string;
  due_date: string;
  note: string;
  type: DebtType;
};

type DebtsResponse = {
  data: Debt[];
};

type DebtResponse = {
  data: Debt;
};

const emptyFormState: DebtFormState = {
  amount: "",
  counterpart_name: "",
  due_date: new Date().toISOString().slice(0, 10),
  note: "",
  type: "owed_to_me",
};

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
});

function formatRupiah(value: number) {
  return rupiahFormatter.format(value).replace(/\s/g, " ");
}

function formatRupiahInput(value: string) {
  if (!value) return "";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function parseAmountInput(value: string) {
  const normalizedValue = getDigitsOnly(value);
  return normalizedValue ? Number(normalizedValue) : Number.NaN;
}

function formatRelativeDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffDays) < 1) {
    return "hari ini";
  }

  if (Math.abs(diffDays) < 30) {
    return relativeFormatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeFormatter.format(diffMonths, "month");
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

function isDebtsResponse(payload: unknown): payload is DebtsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    Array.isArray(payload.data)
  );
}

function isDebtResponse(payload: unknown): payload is DebtResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    typeof payload.data === "object" &&
    payload.data !== null
  );
}

function buildFormState(debt: Debt): DebtFormState {
  return {
    amount: String(debt.amount),
    counterpart_name: debt.counterpart_name,
    due_date: debt.due_date ?? new Date().toISOString().slice(0, 10),
    note: debt.note ?? "",
    type: debt.type,
  };
}

export function DashboardClient({
  initialDebts,
  initialError = "",
  userEmail,
}: DashboardClientProps) {
  const [allDebts, setAllDebts] = useState<Debt[]>(initialDebts);
  const [visibleDebts, setVisibleDebts] = useState<Debt[]>(initialDebts);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [busyDebtId, setBusyDebtId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const [formError, setFormError] = useState("");
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [formState, setFormState] = useState<DebtFormState>(emptyFormState);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const summary = useMemo(() => {
    return allDebts
      .filter((debt) => debt.settled_at === null)
      .reduce(
        (total, debt) => {
          if (debt.type === "owed_to_me") {
            total.owedToMe += debt.amount;
          } else {
            total.iOwe += debt.amount;
          }

          total.net = total.owedToMe - total.iOwe;
          return total;
        },
        {
          iOwe: 0,
          net: 0,
          owedToMe: 0,
        },
      );
  }, [allDebts]);

  const displayedDebts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return visibleDebts
      .filter((debt) => {
        if (!normalizedSearch) return true;
        return debt.counterpart_name.toLowerCase().includes(normalizedSearch);
      })
      .toSorted((firstDebt, secondDebt) => {
        if (sortOption === "amount_desc") {
          return secondDebt.amount - firstDebt.amount;
        }

        if (sortOption === "amount_asc") {
          return firstDebt.amount - secondDebt.amount;
        }

        const firstTime = new Date(firstDebt.due_date ?? firstDebt.created_at).getTime();
        const secondTime = new Date(secondDebt.due_date ?? secondDebt.created_at).getTime();

        return sortOption === "oldest" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [searchQuery, sortOption, visibleDebts]);

  async function fetchDebts(nextStatus = statusFilter, nextType = typeFilter) {
    const query = new URLSearchParams();
    if (nextStatus !== "all") query.set("status", nextStatus);
    if (nextType !== "all") query.set("type", nextType);

    const [allResponse, visibleResponse] = await Promise.all([
      fetch("/api/debts"),
      fetch(`/api/debts${query.size ? `?${query.toString()}` : ""}`),
    ]);

    const allPayload: unknown = await allResponse.json();
    const visiblePayload: unknown = await visibleResponse.json();

    if (!allResponse.ok) {
      throw new Error(getErrorMessage(allPayload, "Gagal ambil ringkasan kasbon."));
    }

    if (!visibleResponse.ok) {
      throw new Error(getErrorMessage(visiblePayload, "Gagal ambil daftar kasbon."));
    }

    if (!isDebtsResponse(allPayload) || !isDebtsResponse(visiblePayload)) {
      throw new Error("Format data kasbon tidak valid.");
    }

    setAllDebts(allPayload.data);
    setVisibleDebts(visiblePayload.data);
    setError("");
    setIsLoading(false);
  }

  function applyStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setIsLoading(true);
    fetchDebts(value, typeFilter).catch((fetchError: unknown) => {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal ambil data kasbon.");
      setIsLoading(false);
    });
  }

  function applyTypeFilter(value: TypeFilter) {
    setTypeFilter(value);
    setIsLoading(true);
    fetchDebts(statusFilter, value).catch((fetchError: unknown) => {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal ambil data kasbon.");
      setIsLoading(false);
    });
  }

  function openCreateForm() {
    setFormMode("create");
    setEditingDebt(null);
    setFormState({
      ...emptyFormState,
      due_date: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(debt: Debt) {
    setFormMode("edit");
    setEditingDebt(debt);
    setFormState(buildFormState(debt));
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingDebt(null);
    setFormError("");
  }

  function updateForm<K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateForm() {
    const amount = parseAmountInput(formState.amount);

    if (!formState.counterpart_name.trim()) {
      return "Nama orang wajib diisi.";
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return "Jumlah harus angka Rupiah utuh dan lebih dari 0.";
    }

    if (formState.note.length > 200) {
      return "Catatan maksimal 200 karakter.";
    }

    return "";
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setIsSaving(true);
    setFormError("");

    const body = {
      amount: parseAmountInput(formState.amount),
      counterpart_name: formState.counterpart_name,
      due_date: formState.due_date || null,
      note: formState.note || null,
      type: formState.type,
    };

    const response = await fetch(
      formMode === "edit" && editingDebt ? `/api/debts/${editingDebt.id}` : "/api/debts",
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: formMode === "edit" ? "PATCH" : "POST",
      },
    );

    const payload: unknown = await response.json();

    if (!response.ok) {
      setFormError(getErrorMessage(payload, "Gagal menyimpan kasbon."));
      setIsSaving(false);
      return;
    }

    if (!isDebtResponse(payload)) {
      setFormError("Format data kasbon tidak valid.");
      setIsSaving(false);
      return;
    }

    await fetchDebts();
    setIsSaving(false);
    closeForm();
  }

  async function confirmDeleteDebt() {
    if (!debtToDelete) return;

    setBusyDebtId(debtToDelete.id);
    setIsSaving(true);
    setError("");
    const response = await fetch(`/api/debts/${debtToDelete.id}`, {
      method: "DELETE",
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setError(getErrorMessage(payload, "Gagal menghapus kasbon."));
      setBusyDebtId(null);
      setIsSaving(false);
      return;
    }

    await fetchDebts();
    setBusyDebtId(null);
    setIsSaving(false);
    setDebtToDelete(null);
  }

  async function toggleSettled(debt: Debt) {
    setBusyDebtId(debt.id);
    setError("");
    const response = await fetch(`/api/debts/${debt.id}`, {
      body: JSON.stringify({ settled: debt.settled_at === null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setError(getErrorMessage(payload, "Gagal ubah status kasbon."));
      setBusyDebtId(null);
      return;
    }

    await fetchDebts();
    setBusyDebtId(null);
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <WalletCards aria-hidden="true" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Kasbon</h1>
              <p className="text-sm text-zinc-500">Halo, {userEmail}. Kita siap catat kasbonmu.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total dihutang ke saya" value={summary.owedToMe} />
          <SummaryCard label="Total saya hutang" value={summary.iOwe} />
          <SummaryCard
            label="Net"
            value={summary.net}
            valueClassName={summary.net >= 0 ? "text-emerald-600" : "text-red-600"}
          />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="text-zinc-500" size={18} />
            <h2 className="text-lg font-semibold">Banding total</h2>
          </div>
          <DebtComparisonChart iOwe={summary.iOwe} owedToMe={summary.owedToMe} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold">Catatan kasbon</h2>
              <p className="text-sm text-zinc-500">
                Semua data disimpan di Supabase dan cuma kebaca oleh akun ini.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_150px_150px_190px_140px] lg:items-end">
              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
                Cari nama
                <span className="flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-zinc-900">
                  <Search aria-hidden="true" className="mr-2 shrink-0 text-zinc-400" size={16} />
                  <input
                    className="min-w-0 flex-1 text-sm outline-none"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari Anton..."
                    value={searchQuery}
                  />
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
                Status
                <select
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
                  onChange={(event) => applyStatusFilter(event.target.value as StatusFilter)}
                  value={statusFilter}
                >
                  <option value="all">Semua</option>
                  <option value="unsettled">Belum lunas</option>
                  <option value="settled">Lunas</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
                Tipe
                <select
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
                  onChange={(event) => applyTypeFilter(event.target.value as TypeFilter)}
                  value={typeFilter}
                >
                  <option value="all">Semua</option>
                  <option value="owed_to_me">Dihutang</option>
                  <option value="i_owe">Saya hutang</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
                Urutkan
                <select
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
                  onChange={(event) => setSortOption(event.target.value as SortOption)}
                  value={sortOption}
                >
                  <option value="newest">Tanggal terbaru</option>
                  <option value="oldest">Tanggal terlama</option>
                  <option value="amount_desc">Jumlah terbesar</option>
                  <option value="amount_asc">Jumlah terkecil</option>
                </select>
              </label>

              <button
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={openCreateForm}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Catat baru
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
                <p className="font-medium">Lagi ambil data...</p>
                <p className="mt-1 text-sm text-zinc-500">Sebentar, kasbonmu lagi disusun.</p>
              </div>
            ) : displayedDebts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
                <p className="font-medium">
                  {searchQuery.trim() ? "Nama itu belum ada di list." : "Belum ada kasbon."}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {searchQuery.trim()
                    ? "Coba ubah kata pencarian atau filter."
                    : "Catat yang pertama biar summary-nya mulai hidup."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1.5fr] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 lg:grid">
                  <span>Nama</span>
                  <span>Tipe</span>
                  <span>Jumlah</span>
                  <span>Tanggal</span>
                  <span>Status</span>
                  <span className="text-right">Aksi</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {displayedDebts.map((debt) => (
                    <DebtRow
                      busy={busyDebtId === debt.id}
                      debt={debt}
                      key={debt.id}
                      onDelete={setDebtToDelete}
                      onEdit={openEditForm}
                      onToggleSettled={toggleSettled}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30 px-4 py-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {formMode === "edit" ? "Edit kasbon" : "Catat kasbon baru"}
                </h2>
                <p className="text-sm text-zinc-500">Isi singkat aja, nanti bisa diubah.</p>
              </div>
              <button
                aria-label="Tutup form"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-50"
                onClick={closeForm}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submitForm}>
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium">
                  <input
                    checked={formState.type === "owed_to_me"}
                    name="type"
                    onChange={() => updateForm("type", "owed_to_me")}
                    type="radio"
                  />
                  Saya dihutang
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium">
                  <input
                    checked={formState.type === "i_owe"}
                    name="type"
                    onChange={() => updateForm("type", "i_owe")}
                    type="radio"
                  />
                  Saya hutang
                </label>
              </fieldset>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
                Nama orang
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 text-base outline-none focus:border-zinc-900"
                  onChange={(event) => updateForm("counterpart_name", event.target.value)}
                  required
                  value={formState.counterpart_name}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
                  Jumlah
                  <div className="flex h-11 items-center overflow-hidden rounded-lg border border-zinc-200 bg-white focus-within:border-zinc-900">
                    <span className="border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-600">
                      Rp
                    </span>
                    <input
                      className="h-full min-w-0 flex-1 px-3 text-base outline-none"
                      inputMode="numeric"
                      onChange={(event) =>
                        updateForm("amount", getDigitsOnly(event.target.value))
                      }
                      onBlur={() => setIsAmountFocused(false)}
                      onFocus={() => setIsAmountFocused(true)}
                      placeholder="1.500.000"
                      required
                      type="text"
                      value={
                        isAmountFocused
                          ? formState.amount
                          : formatRupiahInput(formState.amount)
                      }
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
                  Tanggal
                  <input
                    className="h-11 rounded-lg border border-zinc-200 px-3 text-base outline-none focus:border-zinc-900"
                    onChange={(event) => updateForm("due_date", event.target.value)}
                    type="date"
                    value={formState.due_date}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
                Catatan
                <textarea
                  className="min-h-24 rounded-lg border border-zinc-200 px-3 py-2 text-base outline-none focus:border-zinc-900"
                  maxLength={200}
                  onChange={(event) => updateForm("note", event.target.value)}
                  placeholder="Opsional"
                  value={formState.note}
                />
                <span className="text-xs text-zinc-500">{formState.note.length}/200</span>
              </label>

              {formError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-semibold transition hover:bg-zinc-50"
                  onClick={closeForm}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="h-10 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {debtToDelete ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30 px-4 py-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Hapus kasbon?</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Data ini bakal hilang permanen dari catatan kamu.
                </p>
              </div>
              <button
                aria-label="Tutup konfirmasi hapus"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-50"
                disabled={isSaving}
                onClick={() => setDebtToDelete(null)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold">{debtToDelete.counterpart_name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600">
                <span>{debtToDelete.type === "owed_to_me" ? "Dihutang" : "Saya hutang"}</span>
                <span aria-hidden="true">-</span>
                <span>{formatRupiah(debtToDelete.amount)}</span>
              </div>
              {debtToDelete.note ? (
                <p className="mt-2 text-sm text-zinc-500">{debtToDelete.note}</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={() => setDebtToDelete(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={confirmDeleteDebt}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                {isSaving ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryCard({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{formatRupiah(value)}</p>
    </div>
  );
}

function DebtComparisonChart({ iOwe, owedToMe }: { iOwe: number; owedToMe: number }) {
  const maxValue = Math.max(iOwe, owedToMe, 1);

  return (
    <div className="space-y-4">
      <ChartBar
        label="Dihutang ke saya"
        value={owedToMe}
        widthPercent={(owedToMe / maxValue) * 100}
        tone="emerald"
      />
      <ChartBar
        label="Saya hutang"
        value={iOwe}
        widthPercent={(iOwe / maxValue) * 100}
        tone="red"
      />
    </div>
  );
}

function ChartBar({
  label,
  tone,
  value,
  widthPercent,
}: {
  label: string;
  tone: "emerald" | "red";
  value: number;
  widthPercent: number;
}) {
  const colorClass = tone === "emerald" ? "bg-emerald-600" : "bg-red-500";

  return (
    <div className="grid gap-2 sm:grid-cols-[150px_1fr_140px] sm:items-center">
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
        <div
          aria-hidden="true"
          className={`h-full min-w-1 rounded-full ${colorClass}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="text-sm font-semibold sm:text-right">{formatRupiah(value)}</p>
    </div>
  );
}

function DebtRow({
  busy,
  debt,
  onDelete,
  onEdit,
  onToggleSettled,
}: {
  busy: boolean;
  debt: Debt;
  onDelete: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onToggleSettled: (debt: Debt) => void;
}) {
  const isSettled = debt.settled_at !== null;

  return (
    <div
      className={`grid gap-3 px-4 py-4 transition lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1.5fr] lg:items-center ${
        busy ? "bg-zinc-50 opacity-70" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="font-semibold">{debt.counterpart_name}</p>
        {debt.note ? <p className="mt-1 text-sm text-zinc-500">{debt.note}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:contents">
        <p className="text-zinc-600">
          <span className="mb-1 block text-xs font-semibold uppercase text-zinc-400 lg:hidden">
            Tipe
          </span>
          {debt.type === "owed_to_me" ? "Dihutang" : "Saya hutang"}
        </p>
        <p className="font-semibold">
          <span className="mb-1 block text-xs font-semibold uppercase text-zinc-400 lg:hidden">
            Jumlah
          </span>
          {formatRupiah(debt.amount)}
        </p>
        <p className="text-zinc-600">
          <span className="mb-1 block text-xs font-semibold uppercase text-zinc-400 lg:hidden">
            Tanggal
          </span>
          {formatRelativeDate(debt.due_date ?? debt.created_at)}
        </p>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isSettled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isSettled ? "Lunas" : "Belum lunas"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 pt-1 lg:justify-end lg:pt-0">
        <button
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          disabled={busy}
          onClick={() => onToggleSettled(debt)}
          type="button"
        >
          {isSettled ? <Clock3 aria-hidden="true" size={15} /> : <Check aria-hidden="true" size={15} />}
          {busy ? "Memproses..." : isSettled ? "Buka lagi" : "Tandai lunas"}
        </button>
        {!isSettled ? (
          <>
            <button
              aria-label={`Edit kasbon ${debt.counterpart_name}`}
              className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => onEdit(debt)}
              type="button"
            >
              <Pencil aria-hidden="true" size={15} />
            </button>
            <button
              aria-label={`Hapus kasbon ${debt.counterpart_name}`}
              className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => onDelete(debt)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
