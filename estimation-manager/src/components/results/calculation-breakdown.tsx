"use client";

import type { EstimationResult } from "@/lib/contracts/result";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0">
      <div>
        <span className="text-sm">{label}</span>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <span className="text-sm font-mono font-medium">{value}</span>
    </div>
  );
}

export function CalculationBreakdown({ result }: { result: EstimationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rechenweg</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion multiple defaultValue={["fp", "effort"]}>
          <AccordionItem value="fp">
            <AccordionTrigger className="text-sm">
              Schritt 1–3: Function Points & Skalierung
            </AccordionTrigger>
            <AccordionContent className="space-y-0">
              <Row label="Roh-Function-Points (rFP)" value={result.rawFP.toFixed(2)} />
              <Row
                label="Value Adjustment Factor (VAF)"
                value={result.vaf.toFixed(4)}
                sub="Berechnet aus den Anpassungsfaktoren"
              />
              <Row
                label="Adjustierte Function Points (aFP)"
                value={result.adjustedFP.toFixed(2)}
                sub="rFP × VAF"
              />
              <Row
                label="Skalierungsfaktor"
                value={result.scaleFactor.toFixed(4)}
                sub="Benutzer-Bucket × Sprachen-Multiplikator"
              />
              <Row
                label="Skalierte aFP"
                value={(result.adjustedFP * result.scaleFactor).toFixed(2)}
                sub="aFP × Skalierungsfaktor"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="effort">
            <AccordionTrigger className="text-sm">
              Schritt 4: Aufwand (Personentage)
            </AccordionTrigger>
            <AccordionContent>
              <Row
                label="Aufwand (erwartet)"
                value={`${result.effortPD.expected.toFixed(2)} PT`}
                sub="Produktivität × (aFP × Skalierung)^Exponent × (1 + Risikozuschlag)"
              />
              <Row label="Untere Grenze (−30 %)" value={`${result.effortPD.low.toFixed(2)} PT`} />
              <Row label="Obere Grenze (+30 %)" value={`${result.effortPD.high.toFixed(2)} PT`} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="duration">
            <AccordionTrigger className="text-sm">
              Schritt 8: Dauer
            </AccordionTrigger>
            <AccordionContent>
              <Row
                label="Nominaldauer"
                value={`${result.duration.nominalMonths.toFixed(2)} Monate`}
                sub="COCOMO Schedule-Schätzung"
              />
              {result.duration.capacityMonths !== undefined && (
                <Row
                  label="Kapazitätsbasierte Dauer"
                  value={`${result.duration.capacityMonths.toFixed(2)} Monate`}
                  sub="Aufwand / (Teamgröße × produktive Tage)"
                />
              )}
              <Row
                label="Gewählte Dauer (Maximum)"
                value={`${result.duration.durationMonths.toFixed(2)} Monate`}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
