import Link from "next/link";
import { notFound } from "next/navigation";
import { listProjects } from "@/app/actions/projects";
import { listEstimations } from "@/app/actions/estimations";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DuplicateEstimationButton } from "@/components/duplicate-estimation-button";
import { cn } from "@/lib/utils";
import { Plus, ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  final: "Final",
  archived: "Archiviert",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  final: "default",
  archived: "outline",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projectsResult, estimationsResult] = await Promise.all([
    listProjects(),
    listEstimations(id),
  ]);

  if (!projectsResult.success) notFound();
  const project = projectsResult.data.find((p) => p.id === id);
  if (!project) notFound();

  const estimations = estimationsResult.success ? estimationsResult.data : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />Projekte
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.client && <p className="text-gray-500">{project.client}</p>}
          {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
        </div>
        <Link href={`/estimations/new?projectId=${id}`} className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Schätzung
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schätzungen</CardTitle>
        </CardHeader>
        <CardContent>
          {estimations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>Noch keine Schätzungen für dieses Projekt.</p>
              <Link href={`/estimations/new?projectId=${id}`} className={cn(buttonVariants(), "mt-4 inline-flex")}>
                Erste Schätzung erstellen
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aufwand (PT)</TableHead>
                  <TableHead>Kosten</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimations.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell className="font-medium">
                      <Link href={`/estimations/${est.id}`} className="hover:underline">
                        {est.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[est.status] ?? "secondary"}>
                        {STATUS_LABELS[est.status] ?? est.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{est.result.effortPD.expected.toFixed(1)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: est.result.currency,
                        maximumFractionDigits: 0,
                      }).format(est.result.totalCost.expected)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(est.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DuplicateEstimationButton id={est.id} />
                        <Link href={`/estimations/${est.id}/compare`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                          Vergleich
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
