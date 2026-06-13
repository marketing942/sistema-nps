export type NPSCategory = "promoter" | "neutral" | "detractor";
export type CSATCategory = "satisfied" | "neutral" | "unsatisfied";

export function classifyNps(score: number): NPSCategory {
  if (score >= 9) return "promoter";
  if (score >= 7) return "neutral";
  return "detractor";
}

export function classifyStars(stars: number): NPSCategory {
  if (stars >= 5) return "promoter";
  if (stars === 4) return "neutral";
  return "detractor";
}

export function classifyCsat(score: number): CSATCategory {
  if (score >= 4) return "satisfied";
  if (score === 3) return "neutral";
  return "unsatisfied";
}

export interface NpsBuckets {
  promoters: number;
  neutrals: number;
  detractors: number;
  total: number;
}

export function calcNps(buckets: NpsBuckets): number | null {
  if (buckets.total === 0) return null;
  return Math.round(
    ((buckets.promoters - buckets.detractors) / buckets.total) * 100
  );
}

export function calcPercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function calcCsatScore(satisfied: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((satisfied / total) * 100);
}

export function npsLabel(value: number | null): {
  label: string;
  tone: "good" | "neutral" | "bad" | "empty";
} {
  if (value === null || Number.isNaN(value))
    return { label: "Sem dados", tone: "empty" };
  if (value >= 75) return { label: "Zona de Excelência", tone: "good" };
  if (value >= 50) return { label: "Zona de Qualidade", tone: "good" };
  if (value >= 0) return { label: "Zona de Aperfeiçoamento", tone: "neutral" };
  return { label: "Zona Crítica", tone: "bad" };
}

export const NPS_ZONES = [
  { min: -100, max: 0, label: "Zona Crítica", color: "#ef4444" },
  { min: 0, max: 50, label: "Zona de Aperfeiçoamento", color: "#f59e0b" },
  { min: 50, max: 75, label: "Zona de Qualidade", color: "#22c55e" },
  { min: 75, max: 100, label: "Zona de Excelência", color: "#059669" },
] as const;

const RISK_KEYWORDS = [
  "cancelar",
  "cancelamento",
  "péssimo",
  "pessimo",
  "horrível",
  "horrivel",
  "ruim",
  "não recomendo",
  "nao recomendo",
  "decepcion",
  "atendimento ruim",
  "professor ruim",
  "estrutura ruim",
  "reclamação",
  "reclamacao",
  "raiva",
  "lixo",
  "desistir",
  "desisti",
  "perdi dinheiro",
  "enganaram",
  "fraude",
];

export function detectRisk(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RISK_KEYWORDS.some((k) => lower.includes(k));
}
