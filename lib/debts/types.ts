import type { Database } from "@/lib/supabase/database.types";

export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type DebtType = Database["public"]["Enums"]["debt_type"];
export type StatusFilter = "all" | "unsettled" | "settled";
export type TypeFilter = "all" | DebtType;
export type FormMode = "create" | "edit";
export type SortOption = "newest" | "oldest" | "amount_desc" | "amount_asc";

export type DebtFormState = {
  amount: string;
  counterpart_name: string;
  due_date: string;
  note: string;
  type: DebtType;
};

export type DebtSummary = {
  iOwe: number;
  net: number;
  owedToMe: number;
};
