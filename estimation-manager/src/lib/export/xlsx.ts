import * as XLSX from "xlsx";
import type { InferSelectModel } from "drizzle-orm";
import type { estimations } from "@/lib/db/schema";

type Estimation = InferSelectModel<typeof estimations>;

function fmt(n: number) {
  return Math.round(n);
}

export function generateXlsx(estimation: Estimation): Buffer {
  const r = estimation.result;
  const wb = XLSX.utils.book_new();

  // ── Summary sheet ────────────────────────────────────────────────────────
  const summaryData = [
    ["Estimation Manager – Projektschätzung"],
    [],
    ["Titel", estimation.title],
    ["Erstellt am", new Date(estimation.createdAt).toLocaleDateString("de-DE")],
    ["Engine Version", estimation.engineVersion],
    ["Profil Version", estimation.profileVersion],
    [],
    ["Kennzahl", "Niedrig", "Erwartet", "Hoch"],
    [
      "Aufwand (PT)",
      +r.effortPD.low.toFixed(1),
      +r.effortPD.expected.toFixed(1),
      +r.effortPD.high.toFixed(1),
    ],
    [
      `Gesamtkosten (${r.currency})`,
      fmt(r.totalCost.low),
      fmt(r.totalCost.expected),
      fmt(r.totalCost.high),
    ],
    [],
    ["Projektdauer (Monate)", "", +r.duration.durationMonths.toFixed(2)],
    ["Roh-Function-Points", "", +r.rawFP.toFixed(2)],
    ["Adjustierte FP", "", +r.adjustedFP.toFixed(2)],
    ["VAF", "", +r.vaf.toFixed(4)],
    ["Skalierungsfaktor", "", +r.scaleFactor.toFixed(4)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Zusammenfassung");

  // ── Phases sheet ─────────────────────────────────────────────────────────
  const phasesData = [
    ["Phase", "Anteil (%)", "Aufwand (PT)", "Aufwand niedrig", "Aufwand hoch"],
    ...r.phases.map((p) => [
      p.name,
      +(p.share * 100).toFixed(1),
      +p.effortPD.toFixed(1),
      +(p.effortPD * (1 - 0.3)).toFixed(1),
      +(p.effortPD * (1 + 0.3)).toFixed(1),
    ]),
  ];
  const wsPhases = XLSX.utils.aoa_to_sheet(phasesData);
  wsPhases["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsPhases, "Phasen");

  // ── Roles sheet ──────────────────────────────────────────────────────────
  const rolesData = [
    [`Rolle`, "Anteil (%)", "Aufwand (PT)", `Tagessatz (${r.currency})`, `Kosten (${r.currency})`],
    ...r.roles.map((role) => [
      role.name,
      +(role.share * 100).toFixed(1),
      +role.effortPD.toFixed(1),
      fmt(role.dailyRate),
      fmt(role.cost),
    ]),
  ];
  const wsRoles = XLSX.utils.aoa_to_sheet(rolesData);
  wsRoles["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsRoles, "Rollen");

  // ── Dimensions sheet ─────────────────────────────────────────────────────
  const { dimensions } = r;
  const dimsData = [
    ["Dimension", "FP-Anteil"],
    ["Funktionalität", +dimensions.functionality.toFixed(2)],
    ["Integration", +dimensions.integration.toFixed(2)],
    ["Komplexität", +dimensions.complexity.toFixed(2)],
    ["Skalierung", +dimensions.scalability.toFixed(2)],
  ];
  const wsDims = XLSX.utils.aoa_to_sheet(dimsData);
  wsDims["!cols"] = [{ wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDims, "Dimensionen");

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
