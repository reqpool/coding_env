export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { estimations } from "@/lib/db/schema";
import { validateApiKey, getApiKey, unauthorized, notFound, badRequest } from "@/lib/api/auth";
import { generatePdf } from "@/lib/export/pdf";
import { generateXlsx } from "@/lib/export/xlsx";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateApiKey(getApiKey(req))) return unauthorized();

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  if (format !== "pdf" && format !== "xlsx") {
    return badRequest("format must be 'pdf' or 'xlsx'");
  }

  const [estimation] = await db.select().from(estimations).where(eq(estimations.id, id));
  if (!estimation) return notFound("Estimation not found");

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
