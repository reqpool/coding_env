"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIMENSION_LABELS: Record<string, string> = {
  functionality: "Funktionalität",
  integration: "Integration",
  complexity: "Komplexität",
  scalability: "Skalierung",
};
const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

export function DimensionChart({ result }: { result: EstimationResult }) {
  const data = Object.entries(result.dimensions).map(([key, value], i) => ({
    name: DIMENSION_LABELS[key] ?? key,
    value: Math.round(value * 1000) / 10,
    color: COLORS[i % COLORS.length]!,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dimensionsverteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value}%`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => typeof v === "number" ? [`${v} %`, ""] : []} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
