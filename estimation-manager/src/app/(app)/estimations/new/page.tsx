"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { computeEstimationAction, saveEstimation } from "@/app/actions/estimations";
import { listProfiles } from "@/app/actions/profiles";
import type { EstimationResult } from "@/lib/contracts/result";
import type { DbCalibrationProfile } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { LivePreview } from "@/components/wizard/live-preview";
import { DEFAULT_VAF_FACTORS, DRIVER_LABELS, COMPLEXITY_LABELS, type WizardState } from "@/components/wizard/types";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

const STEPS = ["Projektbasis", "Kostentreiber", "Anpassungsfaktoren", "Team & Sätze", "Ergebnis"];

const INITIAL_STATE: WizardState = {
  projectId: "",
  title: "",
  profileId: "",
  currency: "EUR",
  drivers: {
    masks:           { count: 0, complexity: "medium" },
    useCases:        { count: 0, complexity: "medium" },
    businessObjects: { count: 0, complexity: "medium" },
    interfaces:      { count: 0, complexity: "medium" },
    batches:         { count: 0, complexity: "medium" },
    roles:           { count: 0, complexity: "medium" },
    users: 0,
    languages: 1,
  },
  factors: Object.fromEntries(DEFAULT_VAF_FACTORS.map((f) => [f.key, 3])),
  teamSize: undefined,
};

type DriverKey = keyof Omit<WizardState["drivers"], "users" | "languages">;
const DRIVER_KEYS: DriverKey[] = ["masks", "useCases", "businessObjects", "interfaces", "batches", "roles"];

export default function NewEstimationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({ ...INITIAL_STATE, projectId });
  const [profiles, setProfiles] = useState<DbCalibrationProfile[]>([]);
  const [preview, setPreview] = useState<EstimationResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listProfiles().then((r) => {
      if (r.success) {
        setProfiles(r.data);
        const active = r.data.find((p) => p.isActive);
        if (active) setState((s) => ({ ...s, profileId: active.id }));
      }
    });
  }, []);

  const schedulePreview = useCallback(
    (s: WizardState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPreviewLoading(true);
        startTransition(async () => {
          const result = await computeEstimationAction(
            {
              drivers: s.drivers,
              factors: s.factors,
              teamSize: s.teamSize,
              currency: s.currency,
            },
            s.profileId || undefined,
          );
          if (result.success) setPreview(result.data);
          setPreviewLoading(false);
        });
      }, 350);
    },
    [],
  );

  function update(patch: Partial<WizardState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      schedulePreview(next);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const result = await saveEstimation(
        state.projectId,
        { drivers: state.drivers, factors: state.factors, teamSize: state.teamSize, currency: state.currency },
        state.title || "Neue Schätzung",
        state.profileId || undefined,
      );
      if (result.success) {
        router.push(`/estimations/${result.data.id}`);
      } else {
        setError(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Neue Schätzung</h1>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                i === step
                  ? "bg-blue-600 text-white font-medium"
                  : i < step
                  ? "bg-blue-100 text-blue-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-default"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold bg-white/20">
                {i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        {/* Main panel */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Projekttitel *</Label>
                  <Input
                    placeholder="z.B. Auftragsmanagement-System"
                    value={state.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kalibrierungsprofil</Label>
                  <Select value={state.profileId} onValueChange={(v) => { if (v !== null) update({ profileId: v }); }}>
                    <SelectTrigger><SelectValue placeholder="Profil wählen" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.isActive && "(aktiv)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Währung</Label>
                  <Select value={state.currency} onValueChange={(v) => { if (v !== null) update({ currency: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR – Euro</SelectItem>
                      <SelectItem value="CHF">CHF – Schweizer Franken</SelectItem>
                      <SelectItem value="USD">USD – US-Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Geben Sie Menge und Komplexität für jeden Kostentreiber an.
                </p>
                {DRIVER_KEYS.map((key) => (
                  <div key={key} className="grid grid-cols-[1fr_160px] gap-3 items-end">
                    <div className="space-y-2">
                      <Label>{DRIVER_LABELS[key]}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={state.drivers[key].count}
                        onChange={(e) =>
                          update({
                            drivers: {
                              ...state.drivers,
                              [key]: { ...state.drivers[key], count: Math.max(0, Number(e.target.value)) },
                            },
                          })
                        }
                      />
                    </div>
                    <Select
                      value={state.drivers[key].complexity}
                      onValueChange={(v) => {
                        if (v !== null) update({
                          drivers: {
                            ...state.drivers,
                            [key]: { ...state.drivers[key], complexity: v as "low" | "medium" | "high" },
                          },
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPLEXITY_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{DRIVER_LABELS.users}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={state.drivers.users}
                      onChange={(e) =>
                        update({ drivers: { ...state.drivers, users: Math.max(0, Number(e.target.value)) } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{DRIVER_LABELS.languages}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={state.drivers.languages}
                      onChange={(e) =>
                        update({ drivers: { ...state.drivers, languages: Math.max(1, Number(e.target.value)) } })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-sm text-gray-500">
                  Bewerten Sie nicht-funktionale Einflussfaktoren auf einer Skala von 0 (kein Einfluss) bis 5 (sehr starker Einfluss). Neutral = 3.
                </p>
                {DEFAULT_VAF_FACTORS.map((factor) => (
                  <div key={factor.key} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <Label>{factor.label}</Label>
                      <span className="text-sm font-semibold text-blue-600">
                        {state.factors[factor.key] ?? 3}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{factor.description}</p>
                    <Slider
                      min={0}
                      max={5}
                      step={1}
                      value={[state.factors[factor.key] ?? 3]}
                      onValueChange={(v) => {
                        const val = typeof v === "number" ? v : (v as readonly number[])[0] ?? 3;
                        update({ factors: { ...state.factors, [factor.key]: val } });
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>0 – kein Einfluss</span>
                      <span>5 – starker Einfluss</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Teamgröße (parallele Vollzeitkräfte)</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Optional – für kapazitätsbasierte Dauerberechnung"
                    value={state.teamSize ?? ""}
                    onChange={(e) =>
                      update({ teamSize: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Tagessätze und Rollenverteilung werden aus dem gewählten Kalibrierungsprofil übernommen.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {preview ? (
                  <>
                    <p className="text-sm text-gray-500">
                      Überprüfen Sie die Schätzung und speichern Sie sie als Projekt-Snapshot.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Aufwand erwartet", value: `${preview.effortPD.expected.toFixed(1)} PT` },
                        { label: "Aufwand Band", value: `${preview.effortPD.low.toFixed(1)} – ${preview.effortPD.high.toFixed(1)} PT` },
                        { label: "Dauer", value: `${preview.duration.durationMonths.toFixed(1)} Monate` },
                        { label: "Function Points", value: `${preview.adjustedFP.toFixed(0)} AFP` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="font-semibold mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button onClick={handleSave} disabled={saving} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Wird gespeichert…" : "Schätzung speichern"}
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Bitte füllen Sie zunächst die Kostentreiber aus.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live preview panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Live-Vorschau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LivePreview result={preview} loading={previewLoading || isPending} currency={state.currency} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => setStep((s) => s + 1)}>
            Weiter
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
