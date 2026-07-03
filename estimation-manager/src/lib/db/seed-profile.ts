import type { CalibrationProfile } from "@/lib/contracts/profile";

export const STANDARD_2026_PROFILE: CalibrationProfile = {
  name: "Standard 2026",
  version: 1,

  fpWeights: {
    masks:           { low: 3,  medium: 5,  high: 8  },
    useCases:        { low: 4,  medium: 7,  high: 12 },
    businessObjects: { low: 3,  medium: 6,  high: 10 },
    interfaces:      { low: 5,  medium: 9,  high: 15 },
    batches:         { low: 4,  medium: 7,  high: 11 },
    roles:           { low: 1,  medium: 2,  high: 3  },
  },

  vaf: {
    base: 1.0,
    slope: 0.03,
    min: 0.65,
    max: 1.35,
    neutralValue: 3,
  },

  scale: {
    userBuckets: [
      { maxUsers: 50,   multiplier: 1.00 },
      { maxUsers: 500,  multiplier: 1.10 },
      { maxUsers: 5000, multiplier: 1.20 },
      { maxUsers: Infinity, multiplier: 1.30 },
    ],
    langSlope: 0.08,
  },

  effort: {
    productivity: 0.12,
    scaleExponent: 1.05,
    contingencyPct: 0.10,
  },

  phases: [
    { name: "Spezifikation & Projektmanagement", share: 0.20 },
    { name: "Architektur & Design",              share: 0.12 },
    { name: "Programmierung",                    share: 0.45 },
    { name: "Qualitätssicherung / Test",         share: 0.18 },
    { name: "Rollout & Übergabe",                share: 0.05 },
  ],

  roles: [
    { name: "Projektmanager",      share: 0.12, dailyRate: 1200 },
    { name: "Anforderungsanalyst", share: 0.18, dailyRate: 1050 },
    { name: "Architekturberater",  share: 0.10, dailyRate: 1350 },
    { name: "Softwareengineer",    share: 0.45, dailyRate:  950 },
    { name: "Qualitätssicherer",   share: 0.15, dailyRate:  900 },
  ],

  blendedDailyRate: 1000,

  duration: {
    productiveDaysPerMonth: 18,
    scheduleFactor: 2.5,
    scheduleExponent: 0.33,
  },

  uncertaintyPct: 0.30,
};
