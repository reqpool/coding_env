"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import { Skeleton } from "@/components/ui/skeleton";

interface LivePreviewProps {
  result: EstimationResult | null;
  loading: boolean;
  currency: string;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="py-3 border-b last:border-0">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function LivePreview({ result, loading, currency }: LivePreviewProps) {
  if (loading) {
    return (
      <div className="space-y-4 p-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Geben Sie Kostentreiber ein, um eine Vorschau zu erhalten.
      </p>
    );
  }

  return (
    <div>
      <MetricRow
        label="Aufwand (erwartet)"
        value={`${result.effortPD.expected.toFixed(1)} PT`}
        sub={`${result.effortPD.low.toFixed(1)} – ${result.effortPD.high.toFixed(1)} PT`}
      />
      <MetricRow
        label="Gesamtkosten"
        value={fmt(result.totalCost.expected, currency)}
        sub={`${fmt(result.totalCost.low, currency)} – ${fmt(result.totalCost.high, currency)}`}
      />
      <MetricRow
        label="Dauer"
        value={`${result.duration.durationMonths.toFixed(1)} Monate`}
      />
      <MetricRow
        label="Function Points"
        value={`${result.adjustedFP.toFixed(0)} AFP`}
        sub={`${result.rawFP.toFixed(0)} rFP × VAF ${result.vaf.toFixed(2)}`}
      />
    </div>
  );
}
