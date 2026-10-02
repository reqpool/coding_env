"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#84cc16"];

function fmtCurrency(n: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function RoleChart({ result }: { result: EstimationResult }) {
  const data = result.roles.map((r, i) => ({
    name: r.name,
    pt: Math.round(r.effortPD * 10) / 10,
    cost: r.cost,
    dailyRate: r.dailyRate,
    pct: (r.share * 100).toFixed(0),
    color: COLORS[i % COLORS.length]!,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rollenverteilung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" unit=" PT" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => typeof v === "number" ? [`${v} PT`, "Aufwand"] : []} />
            <Bar dataKey="pt" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rolle</TableHead>
              <TableHead className="text-right">PT</TableHead>
              <TableHead className="text-right">Tagessatz</TableHead>
              <TableHead className="text-right">Kosten</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.name}>
                <TableCell>{d.name}</TableCell>
                <TableCell className="text-right">{d.pt}</TableCell>
                <TableCell className="text-right">{fmtCurrency(d.dailyRate, result.currency)}</TableCell>
                <TableCell className="text-right">{fmtCurrency(d.cost, result.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
