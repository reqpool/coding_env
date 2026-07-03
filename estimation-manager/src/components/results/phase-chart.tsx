"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export function PhaseChart({ result }: { result: EstimationResult }) {
  const data = result.phases.map((p, i) => ({
    name: p.name,
    pt: Math.round(p.effortPD * 10) / 10,
    color: COLORS[i % COLORS.length]!,
    pct: (p.share * 100).toFixed(0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Phasenverteilung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" unit=" PT" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11 }} />
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
              <TableHead>Phase</TableHead>
              <TableHead className="text-right">PT</TableHead>
              <TableHead className="text-right">Anteil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.name}>
                <TableCell>{d.name}</TableCell>
                <TableCell className="text-right">{d.pt}</TableCell>
                <TableCell className="text-right">{d.pct} %</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
