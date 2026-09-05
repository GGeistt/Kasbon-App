"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { parseAmountInput } from "@/lib/debts/formatters";
import type {
  Debt,
  DebtFormState,
  FormMode,
  SortOption,
  StatusFilter,
  TypeFilter,
} from "@/lib/debts/types";

type UseDebtsDashboardOptions = {
  initialDebts: Debt[];
  initialError: string;
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

export function useDebtsDashboard({ initialDebts, initialError }: UseDebtsDashboardOptions) {
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

  async function submitForm(event: FormEvent<HTMLFormElement>) {
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

  return {
    applyStatusFilter,
    applyTypeFilter,
    busyDebtId,
    closeForm,
    confirmDeleteDebt,
    debtToDelete,
    displayedDebts,
    error,
    formError,
    formMode,
    formState,
    isAmountFocused,
    isFormOpen,
    isLoading,
    isSaving,
    openCreateForm,
    openEditForm,
    searchQuery,
    setDebtToDelete,
    setIsAmountFocused,
    setSearchQuery,
    setSortOption,
    sortOption,
    statusFilter,
    submitForm,
    summary,
    toggleSettled,
    typeFilter,
    updateForm,
  };
}
