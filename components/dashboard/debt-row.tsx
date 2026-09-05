import { Check, Clock3, Pencil, Trash2 } from "lucide-react";
import { formatRelativeDate, formatRupiah } from "@/lib/debts/formatters";
import type { Debt } from "@/lib/debts/types";

type DebtRowProps = {
  busy: boolean;
  debt: Debt;
  onDelete: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onToggleSettled: (debt: Debt) => void;
};

export function DebtRow({ busy, debt, onDelete, onEdit, onToggleSettled }: DebtRowProps) {
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
          {isSettled ? (
            <Clock3 aria-hidden="true" size={15} />
          ) : (
            <Check aria-hidden="true" size={15} />
          )}
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
