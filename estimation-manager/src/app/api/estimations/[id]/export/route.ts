export const dynamic = "force-dynamic";

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { estimations, projects } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { generatePdf } from "@/lib/export/pdf";
import { generateXlsx } from "@/lib/export/xlsx";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  if (format !== "pdf" && format !== "xlsx") {
    return Response.json({ error: "format must be 'pdf' or 'xlsx'" }, { status: 400 });
  }

  const [estimation] = await db.select().from(estimations).where(eq(estimations.id, id));
  if (!estimation) return Response.json({ error: "Not found" }, { status: 404 });

  // Verify ownership via project
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, estimation.projectId), eq(projects.ownerId, session.user.id)));
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const slug = estimation.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  if (format === "xlsx") {
    const buffer = generateXlsx(estimation);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
      },
    });
  }

  const buffer = await generatePdf(estimation);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
    },
  });
}
