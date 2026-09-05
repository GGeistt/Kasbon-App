import { Trash2, X } from "lucide-react";
import { formatRupiah } from "@/lib/debts/formatters";
import type { Debt } from "@/lib/debts/types";

type DeleteDebtModalProps = {
  debt: Debt;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteDebtModal({ debt, isSaving, onClose, onConfirm }: DeleteDebtModalProps) {
  return (
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
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-semibold">{debt.counterpart_name}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600">
            <span>{debt.type === "owed_to_me" ? "Dihutang" : "Saya hutang"}</span>
            <span aria-hidden="true">-</span>
            <span>{formatRupiah(debt.amount)}</span>
          </div>
          {debt.note ? <p className="mt-2 text-sm text-zinc-500">{debt.note}</p> : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            {isSaving ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
