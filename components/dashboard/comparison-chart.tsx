import { BarChart3 } from "lucide-react";
import { formatRupiah } from "@/lib/debts/formatters";

type DebtComparisonChartProps = {
  iOwe: number;
  owedToMe: number;
};

export function DebtComparisonChart({ iOwe, owedToMe }: DebtComparisonChartProps) {
  const maxValue = Math.max(iOwe, owedToMe, 1);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 aria-hidden="true" className="text-zinc-500" size={18} />
        <h2 className="text-lg font-semibold">Banding total</h2>
      </div>
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
    </section>
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
