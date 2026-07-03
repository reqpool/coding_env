import Link from "next/link";
import { notFound } from "next/navigation";
import { getEstimation } from "@/app/actions/estimations";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCards } from "@/components/results/metric-cards";
import { PhaseChart } from "@/components/results/phase-chart";
import { RoleChart } from "@/components/results/role-chart";
import { DimensionChart } from "@/components/results/dimension-chart";
import { CalculationBreakdown } from "@/components/results/calculation-breakdown";
import { DuplicateEstimationButton } from "@/components/duplicate-estimation-button";
import { cn } from "@/lib/utils";
import { ArrowLeft, GitCompare } from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary", final: "default", archived: "outline",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf", final: "Final", archived: "Archiviert",
};

export default async function EstimationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEstimation(id);
  if (!result.success) notFound();

  const estimation = result.data;
  const r = estimation.result;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href={`/projects/${estimation.projectId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        <ArrowLeft className="h-4 w-4 mr-1" />Projekt
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{estimation.title}</h1>
            <Badge variant={STATUS_VARIANTS[estimation.status] ?? "secondary"}>
              {STATUS_LABELS[estimation.status] ?? estimation.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Engine v{estimation.engineVersion} · Profil v{estimation.profileVersion} ·{" "}
            {new Date(estimation.createdAt).toLocaleDateString("de-DE")}
          </p>
        </div>
        <div className="flex gap-2">
          <DuplicateEstimationButton id={estimation.id} />
          <Link href={`/estimations/${id}/compare`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <GitCompare className="h-4 w-4 mr-2" />
            Vergleich
          </Link>
        </div>
      </div>

      <MetricCards result={r} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseChart result={r} />
        <RoleChart result={r} />
      </div>

      <DimensionChart result={r} />

      <CalculationBreakdown result={r} />
    </div>
  );
}
