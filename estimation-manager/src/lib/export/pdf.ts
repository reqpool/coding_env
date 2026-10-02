import PDFDocument from "pdfkit";
import type { InferSelectModel } from "drizzle-orm";
import type { estimations } from "@/lib/db/schema";

type Estimation = InferSelectModel<typeof estimations>;

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPt(n: number) {
  return `${n.toFixed(1)} PT`;
}

export async function generatePdf(estimation: Estimation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const r = estimation.result;
    const currency = r.currency;

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Projektschätzung", { align: "left" });
    doc.fontSize(13).font("Helvetica").text(estimation.title, { align: "left" });
    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        `Engine v${estimation.engineVersion}  ·  Profil v${estimation.profileVersion}  ·  ${new Date(estimation.createdAt).toLocaleDateString("de-DE")}`,
      );
    doc.fillColor("#000000").moveDown(1);

    // ── Horizontal rule ──────────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#e5e7eb")
      .stroke()
      .moveDown(0.8);

    // ── KPI Summary ──────────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Zusammenfassung").moveDown(0.5);

    const kpis = [
      ["Aufwand (erwartet)", fmtPt(r.effortPD.expected)],
      ["Aufwand Bandbreite", `${fmtPt(r.effortPD.low)} – ${fmtPt(r.effortPD.high)}`],
      ["Gesamtkosten (erwartet)", fmt(r.totalCost.expected, currency)],
      ["Kosten Bandbreite", `${fmt(r.totalCost.low, currency)} – ${fmt(r.totalCost.high, currency)}`],
      ["Projektdauer", `${r.duration.durationMonths.toFixed(1)} Monate`],
      ["Function Points (roh / adjust.)", `${r.rawFP.toFixed(0)} / ${r.adjustedFP.toFixed(0)}`],
    ];

    kpis.forEach(([label, value]) => {
      const y = doc.y;
      doc.fontSize(9).font("Helvetica").fillColor("#6b7280").text(label, 50, y, { width: 240 });
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#111827").text(value!, 300, y, { width: 245, align: "right" });
      doc.moveDown(0.45);
    });

    doc.moveDown(0.5);

    // ── Phases ───────────────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000").text("Phasenverteilung").moveDown(0.4);

    const phaseHeaders = ["Phase", "Anteil", "Aufwand (PT)"];
    const phaseColWidths = [240, 100, 105];
    renderTable(doc, phaseHeaders, phaseColWidths, r.phases.map((p) => [
      p.name,
      `${(p.share * 100).toFixed(1)} %`,
      fmtPt(p.effortPD),
    ]));

    doc.moveDown(1);

    // ── Roles ────────────────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Rollenverteilung").moveDown(0.4);

    const roleHeaders = ["Rolle", "Anteil", "Aufwand (PT)", "Tagessatz", "Kosten"];
    const roleColWidths = [150, 70, 85, 90, 100];
    renderTable(doc, roleHeaders, roleColWidths, r.roles.map((role) => [
      role.name,
      `${(role.share * 100).toFixed(1)} %`,
      fmtPt(role.effortPD),
      fmt(role.dailyRate, currency),
      fmt(role.cost, currency),
    ]));

    doc.moveDown(1);

    // ── Calculation transparency ─────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Rechenweg").moveDown(0.4);

    const calcRows = [
      ["Roh-Function-Points (rFP)", r.rawFP.toFixed(2)],
      ["Value Adjustment Factor (VAF)", r.vaf.toFixed(4)],
      ["Adjustierte FP (rFP × VAF)", r.adjustedFP.toFixed(2)],
      ["Skalierungsfaktor", r.scaleFactor.toFixed(4)],
      ["Nominaldauer", `${r.duration.nominalMonths.toFixed(2)} Monate`],
      ...(r.duration.capacityMonths !== undefined
        ? [["Kapazitätsbasierte Dauer", `${r.duration.capacityMonths.toFixed(2)} Monate`]]
        : []),
    ];

    calcRows.forEach(([label, value]) => {
      const y = doc.y;
      doc.fontSize(9).font("Helvetica").fillColor("#6b7280").text(label!, 50, y, { width: 300 });
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#111827").text(value!, 360, y, { width: 185, align: "right" });
      doc.moveDown(0.45);
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(`Erstellt mit Estimation Manager`, 50, 780, { align: "center", width: 495 });

    doc.end();
  });
}

function renderTable(
  doc: InstanceType<typeof PDFDocument>,
  headers: string[],
  colWidths: number[],
  rows: string[][],
) {
  const startX = 50;
  let y = doc.y;

  // Header row
  let x = startX;
  headers.forEach((h, i) => {
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#374151")
      .text(h, x, y, { width: colWidths[i]! - 4, align: i === 0 ? "left" : "right" });
    x += colWidths[i]!;
  });

  y += 14;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y)
    .strokeColor("#e5e7eb").lineWidth(0.5).stroke();
  y += 4;

  // Data rows
  rows.forEach((row, ri) => {
    x = startX;
    const rowY = y;
    if (ri % 2 === 0) {
      doc.rect(startX, rowY - 2, colWidths.reduce((a, b) => a + b, 0), 14)
        .fill("#f9fafb").fillColor("#000");
    }
    row.forEach((cell, i) => {
      doc.fontSize(8).font("Helvetica").fillColor("#111827")
        .text(cell, x, rowY, { width: colWidths[i]! - 4, align: i === 0 ? "left" : "right" });
      x += colWidths[i]!;
    });
    y += 14;
  });

  doc.y = y + 4;
}
