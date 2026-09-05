import { Plus, Search } from "lucide-react";
import type { SortOption, StatusFilter, TypeFilter } from "@/lib/debts/types";

type DashboardToolbarProps = {
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
  searchQuery: string;
  sortOption: SortOption;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
};

export function DashboardToolbar({
  onCreate,
  onSearchChange,
  onSortChange,
  onStatusChange,
  onTypeChange,
  searchQuery,
  sortOption,
  statusFilter,
  typeFilter,
}: DashboardToolbarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_150px_150px_190px_140px] lg:items-end">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Cari nama
        <span className="flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-zinc-900">
          <Search aria-hidden="true" className="mr-2 shrink-0 text-zinc-400" size={16} />
          <input
            className="min-w-0 flex-1 text-sm outline-none"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari Anton..."
            value={searchQuery}
          />
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Status
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
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
          onChange={(event) => onTypeChange(event.target.value as TypeFilter)}
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
          onChange={(event) => onSortChange(event.target.value as SortOption)}
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
        onClick={onCreate}
        type="button"
      >
        <Plus aria-hidden="true" size={16} />
        Catat baru
      </button>
    </div>
  );
}
