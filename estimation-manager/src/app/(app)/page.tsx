import Link from "next/link";
import { listProjects } from "@/app/actions/projects";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { cn } from "@/lib/utils";
import { FolderOpen, Plus } from "lucide-react";

export default async function DashboardPage() {
  const result = await listProjects();
  const projects = result.success ? result.data : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projekte</h1>
          <p className="text-gray-500 text-sm mt-1">Verwalten Sie Ihre Schätzprojekte</p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-700">Noch keine Projekte</h2>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Erstellen Sie Ihr erstes Projekt, um mit der Schätzung zu beginnen.
            </p>
            <NewProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.client && (
                      <CardDescription>{project.client}</CardDescription>
                    )}
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    )}
                  </div>
                  <Link href={`/projects/${project.id}`} className={cn(buttonVariants({ size: "sm" }))}>Öffnen</Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
