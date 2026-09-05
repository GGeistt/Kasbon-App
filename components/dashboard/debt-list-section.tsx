import type { Dispatch, SetStateAction } from "react";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DebtRow } from "@/components/dashboard/debt-row";
import type { Debt, SortOption, StatusFilter, TypeFilter } from "@/lib/debts/types";

type DebtListSectionProps = {
  busyDebtId: string | null;
  debts: Debt[];
  error: string;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: Dispatch<SetStateAction<Debt | null>>;
  onEdit: (debt: Debt) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onStatusChange: (value: StatusFilter) => void;
  onToggleSettled: (debt: Debt) => void;
  onTypeChange: (value: TypeFilter) => void;
  searchQuery: string;
  sortOption: SortOption;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
};

export function DebtListSection({
  busyDebtId,
  debts,
  error,
  isLoading,
  onCreate,
  onDelete,
  onEdit,
  onSearchChange,
  onSortChange,
  onStatusChange,
  onToggleSettled,
  onTypeChange,
  searchQuery,
  sortOption,
  statusFilter,
  typeFilter,
}: DebtListSectionProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold">Catatan kasbon</h2>
          <p className="text-sm text-zinc-500">
            Semua data disimpan di Supabase dan cuma kebaca oleh akun ini.
          </p>
        </div>

        <DashboardToolbar
          onCreate={onCreate}
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
          onStatusChange={onStatusChange}
          onTypeChange={onTypeChange}
          searchQuery={searchQuery}
          sortOption={sortOption}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
        />
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
        ) : debts.length === 0 ? (
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
              {debts.map((debt) => (
                <DebtRow
                  busy={busyDebtId === debt.id}
                  debt={debt}
                  key={debt.id}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onToggleSettled={onToggleSettled}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
