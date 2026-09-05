const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
});

export function formatRupiah(value: number) {
  return rupiahFormatter.format(value).replace(/\s/g, " ");
}

export function formatRupiahInput(value: string) {
  if (!value) return "";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function parseAmountInput(value: string) {
  const normalizedValue = getDigitsOnly(value);
  return normalizedValue ? Number(normalizedValue) : Number.NaN;
}

export function formatRelativeDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffDays) < 1) {
    return "hari ini";
  }

  if (Math.abs(diffDays) < 30) {
    return relativeFormatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeFormatter.format(diffMonths, "month");
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
