import { formatRupiah } from "@/lib/debts/formatters";

type SummaryCardProps = {
  label: string;
  value: number;
  valueClassName?: string;
};

export function SummaryCard({ label, value, valueClassName = "" }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{formatRupiah(value)}</p>
    </div>
  );
}
