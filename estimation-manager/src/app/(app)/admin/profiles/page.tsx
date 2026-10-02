import { listProfiles, setActiveProfile } from "@/app/actions/profiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SetActiveButton } from "@/components/set-active-profile-button";

export default async function ProfilesPage() {
  const result = await listProfiles();
  const profiles = result.success ? result.data : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalibrierungsprofile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Verwalten Sie die Koeffizientensätze der Schätz-Engine.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">Keine Profile gefunden. Führen Sie <code>pnpm db:seed</code> aus.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>v{p.version}</TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge>Aktiv</Badge>
                      ) : (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(p.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      {!p.isActive && <SetActiveButton id={p.id} />}
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
