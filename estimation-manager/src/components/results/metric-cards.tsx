"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import { Card, CardContent } from "@/components/ui/card";

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function MetricCard({
  label,
  expected,
  low,
  high,
  unit,
}: {
  label: string;
  expected: string;
  low: string;
  high: string;
  unit?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold mt-1">
          {expected}
          {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {low} – {high}
        </p>
      </CardContent>
    </Card>
  );
}

export function MetricCards({ result }: { result: EstimationResult }) {
  const { effortPD, totalCost, duration, rawFP, adjustedFP, currency } = result;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Aufwand"
        expected={effortPD.expected.toFixed(1)}
        low={effortPD.low.toFixed(1)}
        high={effortPD.high.toFixed(1)}
        unit="PT"
      />
      <MetricCard
        label="Gesamtkosten"
        expected={fmt(totalCost.expected, currency)}
        low={fmt(totalCost.low, currency)}
        high={fmt(totalCost.high, currency)}
      />
      <MetricCard
        label="Dauer"
        expected={duration.durationMonths.toFixed(1)}
        low={duration.durationMonths.toFixed(1)}
        high={duration.durationMonths.toFixed(1)}
        unit="Monate"
      />
      <MetricCard
        label="Function Points"
        expected={adjustedFP.toFixed(0)}
        low={rawFP.toFixed(0)}
        high={adjustedFP.toFixed(0)}
        unit="AFP"
      />
    </div>
  );
}
