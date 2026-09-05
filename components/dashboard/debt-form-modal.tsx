import type { FormEvent } from "react";
import { X } from "lucide-react";
import { formatRupiahInput, getDigitsOnly } from "@/lib/debts/formatters";
import type { DebtFormState, FormMode } from "@/lib/debts/types";

type DebtFormModalProps = {
  formError: string;
  formMode: FormMode;
  formState: DebtFormState;
  isAmountFocused: boolean;
  isSaving: boolean;
  onAmountBlur: () => void;
  onAmountFocus: () => void;
  onChange: <K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function DebtFormModal({
  formError,
  formMode,
  formState,
  isAmountFocused,
  isSaving,
  onAmountBlur,
  onAmountFocus,
  onChange,
  onClose,
  onSubmit,
}: DebtFormModalProps) {
  return (
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
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium">
              <input
                checked={formState.type === "owed_to_me"}
                name="type"
                onChange={() => onChange("type", "owed_to_me")}
                type="radio"
              />
              Saya dihutang
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium">
              <input
                checked={formState.type === "i_owe"}
                name="type"
                onChange={() => onChange("type", "i_owe")}
                type="radio"
              />
              Saya hutang
            </label>
          </fieldset>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Nama orang
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 text-base outline-none focus:border-zinc-900"
              onChange={(event) => onChange("counterpart_name", event.target.value)}
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
                  onBlur={onAmountBlur}
                  onChange={(event) => onChange("amount", getDigitsOnly(event.target.value))}
                  onFocus={onAmountFocus}
                  placeholder="1.500.000"
                  required
                  type="text"
                  value={isAmountFocused ? formState.amount : formatRupiahInput(formState.amount)}
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
              Tanggal
              <input
                className="h-11 rounded-lg border border-zinc-200 px-3 text-base outline-none focus:border-zinc-900"
                onChange={(event) => onChange("due_date", event.target.value)}
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
              onChange={(event) => onChange("note", event.target.value)}
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
              onClick={onClose}
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
  );
}
