"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEstimation, listEstimations } from "@/app/actions/estimations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Estimation } from "@/app/actions/estimations";

function fmt(n: number, c: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
}

function CompareColumn({ est, label }: { est: Estimation; label: string }) {
  const r = est.result;
  const rows = [
    { l: "Aufwand erwartet", v: `${r.effortPD.expected.toFixed(1)} PT` },
    { l: "Aufwand Band", v: `${r.effortPD.low.toFixed(1)} – ${r.effortPD.high.toFixed(1)} PT` },
    { l: "Gesamtkosten", v: fmt(r.totalCost.expected, r.currency) },
    { l: "Kosten Band", v: `${fmt(r.totalCost.low, r.currency)} – ${fmt(r.totalCost.high, r.currency)}` },
    { l: "Dauer", v: `${r.duration.durationMonths.toFixed(1)} Monate` },
    { l: "Roh-FP", v: r.rawFP.toFixed(0) },
    { l: "Adjust. FP", v: r.adjustedFP.toFixed(0) },
    { l: "VAF", v: r.vaf.toFixed(3) },
    { l: "Skalierungsfaktor", v: r.scaleFactor.toFixed(3) },
  ];

  return (
    <div>
      <h2 className="font-semibold text-base mb-3">{label}: {est.title}</h2>
      <div>
        {rows.map(({ l, v }) => (
          <div key={l} className="flex justify-between py-2.5 border-b text-sm">
            <span className="text-gray-500">{l}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { id } = useParams<{ id: string }>();
  const [base, setBase] = useState<Estimation | null>(null);
  const [sibling, setSibling] = useState<Estimation | null>(null);
  const [siblings, setSiblings] = useState<Estimation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEstimation(id).then((r) => {
      if (r.success) {
        setBase(r.data);
        listEstimations(r.data.projectId).then((lr) => {
          if (lr.success) setSiblings(lr.data.filter((e) => e.id !== id));
        });
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!selectedId) { setSibling(null); return; }
    getEstimation(selectedId).then((r) => { if (r.success) setSibling(r.data); });
  }, [selectedId]);

  if (loading) return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
  if (!base) return <p className="text-red-500">Schätzung nicht gefunden.</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/estimations/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />Zurück
        </Link>
        <h1 className="text-2xl font-bold">Szenario-Vergleich</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Vergleich mit:</span>
        <Select value={selectedId} onValueChange={(v) => { if (v !== null) setSelectedId(v); }}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Schätzung wählen…" />
          </SelectTrigger>
          <SelectContent>
            {siblings.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className={`grid gap-8 ${sibling ? "grid-cols-2 divide-x" : "grid-cols-1"}`}>
            <CompareColumn est={base} label="Basis" />
            {sibling && (
              <div className="pl-8">
                <CompareColumn est={sibling} label="Vergleich" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
