import type { EstimationInput } from "@/lib/contracts/input";

export interface WizardState {
  // Step 1
  projectId: string;
  title: string;
  profileId: string;
  currency: string;
  // Steps 2-4 map directly to EstimationInput fields
  drivers: EstimationInput["drivers"];
  factors: Record<string, number>;
  teamSize: number | undefined;
}

export const DEFAULT_VAF_FACTORS = [
  { key: "nonFunctionalComplexity", label: "Nicht-funktionale Komplexität", description: "Performance, Security, Verfügbarkeit" },
  { key: "technicalRisk", label: "Technisches Risiko", description: "Neue / unerprobte Technologie" },
  { key: "dataMigrationComplexity", label: "Datenmigration", description: "Komplexität der Datenmigration" },
  { key: "teamExperience", label: "Team-Erfahrung (invers)", description: "Mehr Erfahrung → geringerer Aufwand" },
  { key: "requirementsVolatility", label: "Anforderungsvolatilität", description: "Wahrscheinlichkeit von Anforderungsänderungen" },
] as const;

export const COMPLEXITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export const DRIVER_LABELS: Record<keyof EstimationInput["drivers"], string> = {
  masks: "Masken / User Interfaces",
  useCases: "Anwendungsfälle",
  businessObjects: "Geschäftsobjekte",
  interfaces: "Schnittstellen",
  batches: "Batches",
  roles: "Rollen",
  users: "Benutzer",
  languages: "Sprachen",
};
