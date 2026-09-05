import type { DebtType } from "@/lib/supabase/database.types";

export type DebtStatusFilter = "all" | "unsettled" | "settled";

export type DebtTypeFilter = "all" | DebtType;

export type DebtCreateInput = {
  user_id: string;
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
};

export type DebtUpdateInput = Partial<
  Pick<DebtCreateInput, "type" | "counterpart_name" | "amount" | "note" | "due_date">
> & {
  settled_at?: string | null;
};

export type ValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

const debtTypes = ["owed_to_me", "i_owe"] as const;
const statusFilters = ["all", "unsettled", "settled"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDebtType(value: unknown): value is DebtType {
  return typeof value === "string" && debtTypes.includes(value as DebtType);
}

function parseOptionalDate(value: unknown, fieldLabel: string): ValidationResult<string | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null, ok: true };
  }

  if (typeof value !== "string") {
    return { message: `${fieldLabel} harus berupa tanggal.`, ok: false };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { message: `${fieldLabel} harus format YYYY-MM-DD.`, ok: false };
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return { message: `${fieldLabel} tidak valid.`, ok: false };
  }

  return { data: value, ok: true };
}

function parseCounterpartName(value: unknown): ValidationResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return { message: "Nama orang wajib diisi.", ok: false };
  }

  return { data: value.trim(), ok: true };
}

function parseAmount(value: unknown): ValidationResult<number> {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { message: "Jumlah harus angka Rupiah utuh dan lebih dari 0.", ok: false };
  }

  return { data: amount, ok: true };
}

function parseNote(value: unknown): ValidationResult<string | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null, ok: true };
  }

  if (typeof value !== "string") {
    return { message: "Catatan harus berupa teks.", ok: false };
  }

  const note = value.trim();

  if (note.length > 200) {
    return { message: "Catatan maksimal 200 karakter.", ok: false };
  }

  return { data: note || null, ok: true };
}

export function parseDebtStatusFilter(value: string | null): ValidationResult<DebtStatusFilter> {
  if (!value || value === "semua") {
    return { data: "all", ok: true };
  }

  if (value === "belum") {
    return { data: "unsettled", ok: true };
  }

  if (value === "lunas") {
    return { data: "settled", ok: true };
  }

  if (statusFilters.includes(value as DebtStatusFilter)) {
    return { data: value as DebtStatusFilter, ok: true };
  }

  return { message: "Filter status tidak valid.", ok: false };
}

export function parseDebtTypeFilter(value: string | null): ValidationResult<DebtTypeFilter> {
  if (!value || value === "all" || value === "semua") {
    return { data: "all", ok: true };
  }

  if (value === "dihutang") {
    return { data: "owed_to_me", ok: true };
  }

  if (value === "hutang") {
    return { data: "i_owe", ok: true };
  }

  if (isDebtType(value)) {
    return { data: value, ok: true };
  }

  return { message: "Filter tipe tidak valid.", ok: false };
}

export function parseCreateDebtBody(
  body: unknown,
  userId: string,
): ValidationResult<DebtCreateInput> {
  if (!isRecord(body)) {
    return { message: "Payload tidak valid.", ok: false };
  }

  if (!isDebtType(body.type)) {
    return { message: "Tipe kasbon tidak valid.", ok: false };
  }

  const counterpartName = parseCounterpartName(body.counterpart_name);
  if (!counterpartName.ok) return counterpartName;

  const amount = parseAmount(body.amount);
  if (!amount.ok) return amount;

  const note = parseNote(body.note);
  if (!note.ok) return note;

  const dueDate = parseOptionalDate(body.due_date, "Tanggal");
  if (!dueDate.ok) return dueDate;

  return {
    data: {
      user_id: userId,
      type: body.type,
      counterpart_name: counterpartName.data,
      amount: amount.data,
      note: note.data,
      due_date: dueDate.data,
    },
    ok: true,
  };
}

export function parseUpdateDebtBody(body: unknown): ValidationResult<DebtUpdateInput> {
  if (!isRecord(body)) {
    return { message: "Payload tidak valid.", ok: false };
  }

  const data: DebtUpdateInput = {};

  if ("type" in body) {
    if (!isDebtType(body.type)) {
      return { message: "Tipe kasbon tidak valid.", ok: false };
    }
    data.type = body.type;
  }

  if ("counterpart_name" in body) {
    const counterpartName = parseCounterpartName(body.counterpart_name);
    if (!counterpartName.ok) return counterpartName;
    data.counterpart_name = counterpartName.data;
  }

  if ("amount" in body) {
    const amount = parseAmount(body.amount);
    if (!amount.ok) return amount;
    data.amount = amount.data;
  }

  if ("note" in body) {
    const note = parseNote(body.note);
    if (!note.ok) return note;
    data.note = note.data;
  }

  if ("due_date" in body) {
    const dueDate = parseOptionalDate(body.due_date, "Tanggal");
    if (!dueDate.ok) return dueDate;
    data.due_date = dueDate.data;
  }

  if ("settled" in body) {
    if (typeof body.settled !== "boolean") {
      return { message: "Status lunas harus true atau false.", ok: false };
    }
    data.settled_at = body.settled ? new Date().toISOString() : null;
  }

  if (Object.keys(data).length === 0) {
    return { message: "Tidak ada data yang diubah.", ok: false };
  }

  return { data, ok: true };
}
