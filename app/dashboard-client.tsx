"use client";

import { WalletCards } from "lucide-react";
import { DebtComparisonChart } from "@/components/dashboard/comparison-chart";
import { DebtFormModal } from "@/components/dashboard/debt-form-modal";
import { DebtListSection } from "@/components/dashboard/debt-list-section";
import { DeleteDebtModal } from "@/components/dashboard/delete-debt-modal";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { useDebtsDashboard } from "@/hooks/use-debts-dashboard";
import type { Debt } from "@/lib/debts/types";

type DashboardClientProps = {
  initialDebts: Debt[];
  initialError?: string;
  userEmail: string;
};

export function DashboardClient({
  initialDebts,
  initialError = "",
  userEmail,
}: DashboardClientProps) {
  const dashboard = useDebtsDashboard({ initialDebts, initialError });

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
          <SummaryCard label="Total dihutang ke saya" value={dashboard.summary.owedToMe} />
          <SummaryCard label="Total saya hutang" value={dashboard.summary.iOwe} />
          <SummaryCard
            label="Net"
            value={dashboard.summary.net}
            valueClassName={dashboard.summary.net >= 0 ? "text-emerald-600" : "text-red-600"}
          />
        </section>

        <DebtComparisonChart
          iOwe={dashboard.summary.iOwe}
          owedToMe={dashboard.summary.owedToMe}
        />

        <DebtListSection
          busyDebtId={dashboard.busyDebtId}
          debts={dashboard.displayedDebts}
          error={dashboard.error}
          isLoading={dashboard.isLoading}
          onCreate={dashboard.openCreateForm}
          onDelete={dashboard.setDebtToDelete}
          onEdit={dashboard.openEditForm}
          onSearchChange={dashboard.setSearchQuery}
          onSortChange={dashboard.setSortOption}
          onStatusChange={dashboard.applyStatusFilter}
          onToggleSettled={dashboard.toggleSettled}
          onTypeChange={dashboard.applyTypeFilter}
          searchQuery={dashboard.searchQuery}
          sortOption={dashboard.sortOption}
          statusFilter={dashboard.statusFilter}
          typeFilter={dashboard.typeFilter}
        />
      </div>

      {dashboard.isFormOpen ? (
        <DebtFormModal
          formError={dashboard.formError}
          formMode={dashboard.formMode}
          formState={dashboard.formState}
          isAmountFocused={dashboard.isAmountFocused}
          isSaving={dashboard.isSaving}
          onAmountBlur={() => dashboard.setIsAmountFocused(false)}
          onAmountFocus={() => dashboard.setIsAmountFocused(true)}
          onChange={dashboard.updateForm}
          onClose={dashboard.closeForm}
          onSubmit={dashboard.submitForm}
        />
      ) : null}

      {dashboard.debtToDelete ? (
        <DeleteDebtModal
          debt={dashboard.debtToDelete}
          isSaving={dashboard.isSaving}
          onClose={() => dashboard.setDebtToDelete(null)}
          onConfirm={dashboard.confirmDeleteDebt}
        />
      ) : null}
    </>
  );
}
